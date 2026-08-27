--[[
  Vixi themes for OBS — injects the Chrome extension's theming scripts into
  regular Browser Sources (the Vixi output URL) over the Chrome DevTools
  Protocol. Everything runs inside OBS (LuaJIT + FFI). No helper process.

  OBS must be launched with:
      --remote-debugging-port=9223 --remote-allow-origins=*
  Use Launch OBS Themed.app / Launch OBS (Themed).command, not the Dock icon.
  If OBS asks about Safe Mode, choose Run Normally (Safe Mode disables scripts).

  Install: OBS -> Tools -> Scripts -> "+" -> this file. Keep ../extension
  next to this folder; scripts are read from it live.
]]

local IS_OBS = type(obslua) == "table"
local obs = obslua
local ffi = require("ffi")
local bit = require("bit")

local DEBUG_HOST = "127.0.0.1"
local DEBUG_PORT = 9223

local MESSAGE_THEME_LABELS = {
  { "Off", "off" },
  { "LED Scoreboard", "led-scoreboard" },
  { "Neon Nightclub", "neon-nightclub" },
  { "Ultras Tifo", "ultras-tifo" },
  { "Holo Card", "holo-card" },
  { "Broadcast TV", "broadcast-tv" },
  { "Liquid Glass", "liquid-glass" },
  { "Parallax Drift", "parallax-drift" },
}

local MOSAIC_THEME_LABELS = {
  { "Off", "off" },
  { "Decks", "decks" },
  { "Spotlight", "spotlight" },
  { "Coverflow", "coverflow" },
  { "Fan", "fan" },
  { "Filmstrip", "filmstrip" },
  { "Scatter", "scatter" },
  { "Cascade", "cascade" },
  { "Orbit", "orbit" },
  { "Billboard", "billboard" },
  { "Reels", "reels" },
  { "Polaroid", "polaroid" },
  { "Flipwall", "flipwall" },
  { "Livewall", "livewall" },
  { "Cubes", "cubes" },
  { "Pedestals", "pedestals" },
}

local EXTENSION_FILES = {
  "early.js", "rules.js", "handoff.js", "content.js",
  "mosaic-themes.js", "mosaic.js", "message-themes.js", "message.js",
}

local function log(msg)
  if IS_OBS then
    obs.script_log(obs.LOG_INFO, "[vixi] " .. msg)
  else
    print("[vixi] " .. msg)
  end
end

-- ======================================================================
-- JSON (minimal encode/decode, enough for CDP traffic)
-- ======================================================================

local json_encode

local function json_escape(s)
  s = s:gsub("\\", "\\\\"):gsub('"', '\\"')
  s = s:gsub("[%c]", function(c)
    local b = c:byte()
    if b == 8 then return "\\b" end
    if b == 9 then return "\\t" end
    if b == 10 then return "\\n" end
    if b == 12 then return "\\f" end
    if b == 13 then return "\\r" end
    return string.format("\\u%04x", b)
  end)
  return s
end

json_encode = function(v)
  local t = type(v)
  if v == nil then return "null" end
  if t == "boolean" then return v and "true" or "false" end
  if t == "number" then return string.format("%.17g", v) end
  if t == "string" then return '"' .. json_escape(v) .. '"' end
  if t == "table" then
    if v[1] ~= nil then
      local parts = {}
      for i = 1, #v do parts[i] = json_encode(v[i]) end
      return "[" .. table.concat(parts, ",") .. "]"
    end
    local parts = {}
    for k, val in pairs(v) do
      parts[#parts + 1] = '"' .. json_escape(tostring(k)) .. '":' .. json_encode(val)
    end
    return "{" .. table.concat(parts, ",") .. "}"
  end
  return "null"
end

local function utf8_char(cp)
  if cp < 0x80 then return string.char(cp) end
  if cp < 0x800 then
    return string.char(0xC0 + math.floor(cp / 0x40), 0x80 + cp % 0x40)
  end
  if cp < 0x10000 then
    return string.char(
      0xE0 + math.floor(cp / 0x1000),
      0x80 + math.floor(cp / 0x40) % 0x40,
      0x80 + cp % 0x40
    )
  end
  return string.char(
    0xF0 + math.floor(cp / 0x40000),
    0x80 + math.floor(cp / 0x1000) % 0x40,
    0x80 + math.floor(cp / 0x40) % 0x40,
    0x80 + cp % 0x40
  )
end

local function json_decode(str)
  local pos = 1

  local function skip_ws()
    pos = str:find("[^ \t\r\n]", pos) or (#str + 1)
  end

  local parse_value

  local function parse_string()
    pos = pos + 1 -- opening quote
    local out = {}
    while true do
      local c = str:sub(pos, pos)
      if c == "" then error("unterminated string") end
      if c == '"' then
        pos = pos + 1
        return table.concat(out)
      end
      if c == "\\" then
        local e = str:sub(pos + 1, pos + 1)
        if e == "u" then
          local hex = str:sub(pos + 2, pos + 5)
          local cp = tonumber(hex, 16) or 0
          pos = pos + 6
          if cp >= 0xD800 and cp <= 0xDBFF and str:sub(pos, pos + 1) == "\\u" then
            local lo = tonumber(str:sub(pos + 2, pos + 5), 16) or 0
            cp = 0x10000 + (cp - 0xD800) * 0x400 + (lo - 0xDC00)
            pos = pos + 6
          end
          out[#out + 1] = utf8_char(cp)
        else
          local map = { b = "\b", f = "\f", n = "\n", r = "\r", t = "\t" }
          out[#out + 1] = map[e] or e
          pos = pos + 2
        end
      else
        local nxt = str:find('["\\]', pos) or (#str + 1)
        out[#out + 1] = str:sub(pos, nxt - 1)
        pos = nxt
      end
    end
  end

  parse_value = function()
    skip_ws()
    local c = str:sub(pos, pos)
    if c == '"' then return parse_string() end
    if c == "{" then
      pos = pos + 1
      local o = {}
      skip_ws()
      if str:sub(pos, pos) == "}" then pos = pos + 1 return o end
      while true do
        skip_ws()
        local key = parse_string()
        skip_ws()
        pos = pos + 1 -- ':'
        o[key] = parse_value()
        skip_ws()
        local sep = str:sub(pos, pos)
        pos = pos + 1
        if sep == "}" then return o end
      end
    end
    if c == "[" then
      pos = pos + 1
      local a = {}
      skip_ws()
      if str:sub(pos, pos) == "]" then pos = pos + 1 return a end
      while true do
        a[#a + 1] = parse_value()
        skip_ws()
        local sep = str:sub(pos, pos)
        pos = pos + 1
        if sep == "]" then return a end
      end
    end
    if c == "t" then pos = pos + 4 return true end
    if c == "f" then pos = pos + 5 return false end
    if c == "n" then pos = pos + 4 return nil end
    local num = str:match("^-?%d+%.?%d*[eE]?[+-]?%d*", pos)
    if num then
      pos = pos + #num
      return tonumber(num)
    end
    error("bad json at " .. pos)
  end

  local ok, result = pcall(parse_value)
  if ok then return result end
  return nil
end

-- ======================================================================
-- Sockets (LuaJIT FFI, macOS / Linux / Windows)
-- ======================================================================

local C = ffi.C
local IS_WINDOWS = ffi.os == "Windows"
local IS_MAC = ffi.os == "OSX"

if IS_WINDOWS then
  ffi.cdef([[
    typedef uintptr_t SOCKET;
    typedef struct { char data[512]; } WSADATA_STUB;
    int WSAStartup(unsigned short version, WSADATA_STUB *data);
    int WSAGetLastError(void);
    SOCKET socket(int af, int type, int protocol);
    struct sockaddr_in_win { short family; unsigned short port; uint32_t addr; char zero[8]; };
    int connect(SOCKET s, const struct sockaddr_in_win *name, int namelen);
    int send(SOCKET s, const char *buf, int len, int flags);
    int recv(SOCKET s, char *buf, int len, int flags);
    int closesocket(SOCKET s);
    int ioctlsocket(SOCKET s, long cmd, unsigned long *argp);
    int setsockopt(SOCKET s, int level, int optname, const char *optval, int optlen);
    unsigned short htons(unsigned short v);
    uint32_t inet_addr(const char *cp);
  ]])
  local ws2 = ffi.load("ws2_32")
  C = ws2
  local wsadata = ffi.new("WSADATA_STUB")
  ws2.WSAStartup(0x0202, wsadata)
elseif IS_MAC then
  ffi.cdef([[
    struct sockaddr_in_mac {
      uint8_t sin_len; uint8_t sin_family; uint16_t sin_port;
      uint32_t sin_addr; char sin_zero[8];
    };
    struct timeval_ffi { long tv_sec; int32_t tv_usec; };
    int socket(int domain, int type, int protocol);
    int connect(int s, const struct sockaddr_in_mac *name, uint32_t namelen);
    long send(int s, const void *buf, size_t len, int flags);
    long recv(int s, void *buf, size_t len, int flags);
    int close(int s);
    int fcntl(int fd, int cmd, int arg);
    int setsockopt(int s, int level, int optname, const void *optval, uint32_t optlen);
    uint16_t htons(uint16_t v);
    uint32_t inet_addr(const char *cp);
  ]])
else -- Linux
  ffi.cdef([[
    struct sockaddr_in_linux {
      uint16_t sin_family; uint16_t sin_port;
      uint32_t sin_addr; char sin_zero[8];
    };
    struct timeval_ffi { long tv_sec; long tv_usec; };
    int socket(int domain, int type, int protocol);
    int connect(int s, const struct sockaddr_in_linux *name, uint32_t namelen);
    long send(int s, const void *buf, size_t len, int flags);
    long recv(int s, void *buf, size_t len, int flags);
    int close(int s);
    int fcntl(int fd, int cmd, int arg);
    int setsockopt(int s, int level, int optname, const void *optval, uint32_t optlen);
    uint16_t htons(uint16_t v);
    uint32_t inet_addr(const char *cp);
  ]])
end

local AF_INET, SOCK_STREAM = 2, 1
local INVALID = IS_WINDOWS and ffi.cast("SOCKET", -1) or -1

-- Wall-clock seconds (os.clock is CPU time and stalls in blocking recv).
local now
if IS_WINDOWS then
  now = function() return os.time() end
else
  if IS_MAC then
    ffi.cdef("struct timeval_gtd { long tv_sec; int32_t tv_usec; }; int gettimeofday(struct timeval_gtd*, void*);")
  else
    ffi.cdef("struct timeval_gtd { long tv_sec; long tv_usec; }; int gettimeofday(struct timeval_gtd*, void*);")
  end
  local tv = ffi.new("struct timeval_gtd")
  now = function()
    ffi.C.gettimeofday(tv, nil)
    return tonumber(tv.tv_sec) + tonumber(tv.tv_usec) / 1e6
  end
end

local function sock_set_recv_timeout(fd, ms)
  if IS_WINDOWS then
    local val = ffi.new("uint32_t[1]", ms)
    C.setsockopt(fd, 0xffff, 0x1006, ffi.cast("const char*", val), 4)
  else
    local tv = ffi.new("struct timeval_ffi")
    tv.tv_sec = math.floor(ms / 1000)
    tv.tv_usec = (ms % 1000) * 1000
    C.setsockopt(fd, 0xffff, 0x1006, tv, ffi.sizeof(tv))
  end
end

local function sock_set_nonblocking(fd)
  if IS_WINDOWS then
    local one = ffi.new("unsigned long[1]", 1)
    C.ioctlsocket(fd, 0x8004667E, one) -- FIONBIO
  else
    local F_SETFL = 4
    local O_NONBLOCK = IS_MAC and 0x0004 or 0x800
    C.fcntl(fd, F_SETFL, O_NONBLOCK)
  end
end

local function sock_connect(ip, port)
  local fd = C.socket(AF_INET, SOCK_STREAM, 0)
  if fd == INVALID then return nil, "socket() failed" end
  local addr
  if IS_WINDOWS then
    addr = ffi.new("struct sockaddr_in_win")
    addr.family = AF_INET
    addr.port = C.htons(port)
    addr.addr = C.inet_addr(ip)
  elseif IS_MAC then
    addr = ffi.new("struct sockaddr_in_mac")
    addr.sin_len = ffi.sizeof(addr)
    addr.sin_family = AF_INET
    addr.sin_port = C.htons(port)
    addr.sin_addr = C.inet_addr(ip)
  else
    addr = ffi.new("struct sockaddr_in_linux")
    addr.sin_family = AF_INET
    addr.sin_port = C.htons(port)
    addr.sin_addr = C.inet_addr(ip)
  end
  local rc = C.connect(fd, addr, ffi.sizeof(addr))
  if tonumber(rc) ~= 0 then
    if IS_WINDOWS then C.closesocket(fd) else C.close(fd) end
    return nil, "connect() refused"
  end
  sock_set_recv_timeout(fd, 400)
  return fd
end

local function sock_close(fd)
  if fd == nil then return end
  if IS_WINDOWS then C.closesocket(fd) else C.close(fd) end
end

local function err_is_again(e)
  if IS_WINDOWS then return e == 10035 or e == 10060 end -- WSAEWOULDBLOCK / WSAETIMEDOUT
  if IS_MAC then return e == 35 or e == 4 or e == 60 end -- EAGAIN / EINTR / ETIMEDOUT
  return e == 11 or e == 4 or e == 110
end

local recv_buf = ffi.new("uint8_t[?]", 65536)

local function sock_recv(fd)
  local r
  if IS_WINDOWS then
    r = C.recv(fd, ffi.cast("char*", recv_buf), 65536, 0)
  else
    r = C.recv(fd, recv_buf, 65536, 0)
  end
  r = tonumber(r)
  if r > 0 then return ffi.string(recv_buf, r) end
  if r == 0 then return nil, "closed" end
  local e = IS_WINDOWS and C.WSAGetLastError() or ffi.errno()
  if err_is_again(e) then return nil, "again" end
  return nil, "errno " .. tostring(e)
end

local function sock_send(fd, data)
  local sent = 0
  local total = #data
  local deadline = now() + 3
  while sent < total do
    local chunk = data:sub(sent + 1, sent + 32768)
    local r
    if IS_WINDOWS then
      r = C.send(fd, chunk, #chunk, 0)
    else
      r = C.send(fd, chunk, #chunk, 0)
    end
    r = tonumber(r)
    if r > 0 then
      sent = sent + r
    else
      local e = IS_WINDOWS and C.WSAGetLastError() or ffi.errno()
      if not err_is_again(e) then return false end
      if now() > deadline then return false end
    end
  end
  return true
end

-- ======================================================================
-- WebSocket client (just enough for CDP on localhost)
-- ======================================================================

local B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

local function base64(data)
  local out = {}
  for i = 1, #data, 3 do
    local a, b, c = data:byte(i, i + 2)
    local n = a * 65536 + (b or 0) * 256 + (c or 0)
    local c1 = math.floor(n / 262144) % 64
    local c2 = math.floor(n / 4096) % 64
    local c3 = math.floor(n / 64) % 64
    local c4 = n % 64
    out[#out + 1] = B64:sub(c1 + 1, c1 + 1) .. B64:sub(c2 + 1, c2 + 1)
      .. (b and B64:sub(c3 + 1, c3 + 1) or "=")
      .. (c and B64:sub(c4 + 1, c4 + 1) or "=")
  end
  return table.concat(out)
end

local function mask_payload(s, k1, k2, k3, k4)
  local n = #s
  local buf = ffi.new("uint8_t[?]", n)
  ffi.copy(buf, s, n)
  local keys = ffi.new("uint8_t[4]", k1, k2, k3, k4)
  for i = 0, n - 1 do
    buf[i] = bit.bxor(buf[i], keys[bit.band(i, 3)])
  end
  return ffi.string(buf, n)
end

local function ws_frame(opcode, payload)
  local n = #payload
  local k1, k2, k3, k4 =
    math.random(0, 255), math.random(0, 255), math.random(0, 255), math.random(0, 255)
  local head
  if n <= 125 then
    head = string.char(0x80 + opcode, 0x80 + n)
  elseif n <= 0xffff then
    head = string.char(0x80 + opcode, 0x80 + 126, math.floor(n / 256), n % 256)
  else
    head = string.char(
      0x80 + opcode, 0x80 + 127, 0, 0, 0, 0,
      math.floor(n / 16777216) % 256, math.floor(n / 65536) % 256,
      math.floor(n / 256) % 256, n % 256
    )
  end
  return head .. string.char(k1, k2, k3, k4) .. mask_payload(payload, k1, k2, k3, k4)
end

local function ws_connect(host, port, path)
  local fd, err = sock_connect(host, port)
  if not fd then return nil, err end
  local key = {}
  for _ = 1, 16 do key[#key + 1] = string.char(math.random(0, 255)) end
  local request = table.concat({
    "GET " .. path .. " HTTP/1.1",
    "Host: " .. host .. ":" .. port,
    "Origin: http://" .. host .. ":" .. port,
    "Upgrade: websocket",
    "Connection: Upgrade",
    "Sec-WebSocket-Key: " .. base64(table.concat(key)),
    "Sec-WebSocket-Version: 13",
    "", "",
  }, "\r\n")
  if not sock_send(fd, request) then
    sock_close(fd)
    return nil, "handshake send failed"
  end
  -- Read headers (blocking with recv timeout).
  local buf = ""
  local deadline = now() + 3
  while not buf:find("\r\n\r\n", 1, true) do
    local chunk, rerr = sock_recv(fd)
    if chunk then
      buf = buf .. chunk
    elseif rerr ~= "again" then
      sock_close(fd)
      return nil, "handshake recv failed (" .. tostring(rerr) .. ")"
    end
    if now() > deadline then
      sock_close(fd)
      return nil, "handshake timeout"
    end
  end
  if not buf:find("^HTTP/1%.1 101") then
    sock_close(fd)
    return nil, "handshake rejected"
  end
  sock_set_nonblocking(fd)
  local rest = buf:sub((buf:find("\r\n\r\n", 1, true)) + 4)
  return { fd = fd, buf = rest, open = true, frag = nil }
end

local function ws_send_text(conn, text)
  if not conn.open then return false end
  if not sock_send(conn.fd, ws_frame(1, text)) then
    conn.open = false
    return false
  end
  return true
end

local function ws_parse_frames(conn, out)
  while true do
    local buf = conn.buf
    if #buf < 2 then return end
    local b1, b2 = buf:byte(1, 2)
    local fin = bit.band(b1, 0x80) ~= 0
    local op = bit.band(b1, 0x0f)
    local masked = bit.band(b2, 0x80) ~= 0
    local len = bit.band(b2, 0x7f)
    local pos = 3
    if len == 126 then
      if #buf < 4 then return end
      local a, b = buf:byte(3, 4)
      len = a * 256 + b
      pos = 5
    elseif len == 127 then
      if #buf < 10 then return end
      len = 0
      for i = 3, 10 do len = len * 256 + buf:byte(i) end
      pos = 11
    end
    local mk
    if masked then
      if #buf < pos + 3 then return end
      mk = { buf:byte(pos, pos + 3) }
      pos = pos + 4
    end
    if #buf < pos + len - 1 then return end
    local payload = buf:sub(pos, pos + len - 1)
    conn.buf = buf:sub(pos + len)
    if masked then payload = mask_payload(payload, mk[1], mk[2], mk[3], mk[4]) end
    if op == 1 or op == 2 or op == 0 then
      conn.frag = (conn.frag or "") .. payload
      if fin then
        out[#out + 1] = conn.frag
        conn.frag = nil
      end
    elseif op == 9 then -- ping -> pong
      sock_send(conn.fd, ws_frame(10, payload))
    elseif op == 8 then
      conn.open = false
      return
    end
  end
end

local function ws_poll(conn)
  local msgs = {}
  if not conn.open then return msgs end
  while true do
    local chunk, err = sock_recv(conn.fd)
    if chunk then
      conn.buf = conn.buf .. chunk
    elseif err == "again" then
      break
    else
      conn.open = false
      break
    end
  end
  ws_parse_frames(conn, msgs)
  return msgs
end

local function ws_close(conn)
  if conn and conn.fd then
    sock_close(conn.fd)
    conn.open = false
  end
end

-- ======================================================================
-- DevTools HTTP endpoint (/json/list)
-- ======================================================================

local function http_json_list(host, port)
  local fd, err = sock_connect(host, port)
  if not fd then return nil, err end
  local req = "GET /json/list HTTP/1.1\r\nHost: " .. host .. ":" .. port .. "\r\nConnection: close\r\n\r\n"
  if not sock_send(fd, req) then
    sock_close(fd)
    return nil, "send failed"
  end
  local buf = ""
  local deadline = now() + 2
  local body_at, content_length
  while now() < deadline do
    local chunk, rerr = sock_recv(fd)
    if chunk then
      buf = buf .. chunk
    elseif rerr == "closed" then
      break
    elseif rerr ~= "again" then
      break
    end
    if not body_at then
      body_at = buf:find("\r\n\r\n", 1, true)
      if body_at then
        content_length = tonumber(buf:match("[Cc]ontent%-[Ll]ength:%s*(%d+)"))
      end
    end
    if body_at and content_length and #buf - (body_at + 3) >= content_length then
      break
    end
  end
  sock_close(fd)
  body_at = body_at or buf:find("\r\n\r\n", 1, true)
  if not body_at then return nil, "no response" end
  return json_decode(buf:sub(body_at + 4))
end

-- ======================================================================
-- Theming bundle (reuses the Chrome extension scripts unmodified)
-- ======================================================================

local function extension_dir()
  if IS_OBS then return script_path() .. "../extension/" end
  return "./extension/"
end

local bundle_cache = nil

local function read_extension_src()
  if bundle_cache then return bundle_cache end
  local parts = {}
  for _, name in ipairs(EXTENSION_FILES) do
    local f = io.open(extension_dir() .. name, "r")
    if not f then
      log("missing extension file: " .. extension_dir() .. name)
      return nil
    end
    parts[#parts + 1] = f:read("*a")
    f:close()
  end
  bundle_cache = table.concat(parts, "\n;\n")
  return bundle_cache
end

local function snapshot_settings_json(snap)
  local theme_settings = {}
  if snap.override_colors and snap.message_theme ~= "off" then
    theme_settings[snap.message_theme] = {
      primary = snap.primary_hex,
      secondary = snap.secondary_hex,
    }
  end
  return json_encode({
    enabled = snap.enabled,
    messageTheme = snap.message_theme,
    mosaicTheme = snap.mosaic_theme,
    messageThemeSettings = theme_settings,
    anyOutputIframeHtml = "",
    rules = {},
  })
end

local function build_bundle(snap)
  local src = read_extension_src()
  if not src then return nil end
  local settings = snapshot_settings_json(snap)
  return table.concat({
    "(() => {",
    -- OBS Browser Sources are often reported as hidden tabs. Chromium then
    -- throttles rAF/timers to ~1fps. Force a visible page before theme code runs.
    "(function () {",
    "  try {",
    "    var proto = Document.prototype;",
    "    Object.defineProperty(proto, 'hidden', { configurable: true, get: function () { return false; } });",
    "    Object.defineProperty(proto, 'visibilityState', { configurable: true, get: function () { return 'visible'; } });",
    "  } catch (e) {}",
    "  document.addEventListener('visibilitychange', function (e) { e.stopImmediatePropagation(); }, true);",
    "})();",
    "if (globalThis.__VIXI_OBS__) { globalThis.__VIXI_OBS__.applySettings(" .. settings .. "); return; }",
    "const listeners = [];",
    "let current = " .. settings .. ";",
    "globalThis.__VIXI_OBS__ = {",
    "  applySettings(next) {",
    "    current = next;",
    "    listeners.forEach((fn) => { try { fn({}, 'local'); } catch {} });",
    "  },",
    "};",
    "globalThis.chrome = {",
    "  runtime: { id: 'obs-inject', lastError: null },",
    "  storage: {",
    "    local: {",
    "      get(defaults, cb) { cb(Object.assign({}, defaults, current)); },",
    "      set(values, cb) { Object.assign(current, values); if (cb) cb(); },",
    "    },",
    "    onChanged: { addListener(fn) { listeners.push(fn); } },",
    "  },",
    "};",
    "const boot = () => {",
    src,
    "};",
    "const start = () => { if (document.documentElement) boot(); else setTimeout(start, 0); };",
    "start();",
    "})();",
  }, "\n")
end

-- ======================================================================
-- CDP engine: discover OBS browser-source pages and inject the bundle
-- ======================================================================

local sources = {} -- data table -> true, for every live source instance
local conns = {}   -- ws debugger url -> connection state
local injected = {} -- debugger url -> true (stay detached after a successful inject)
local port_reachable = false
local port_misses = 0
local shutting_down = false
local after_port_up = nil

local function norm_url(u)
  u = tostring(u or "")
  return (u:gsub("/+$", ""))
end

local function is_vixi_url(u)
  return u:find("/go/output/", 1, true) ~= nil or u:find("/go/o/", 1, true) ~= nil
end

local function find_source_for_url(url)
  local target = norm_url(url)
  for data in pairs(sources) do
    if data.snapshot and norm_url(data.snapshot.url) == target then return data end
  end
  -- Fallback: a single configured source claims any Vixi output page (URL
  -- normalization by the browser can make exact compares miss).
  local only
  for data in pairs(sources) do
    if data.snapshot and data.snapshot.url ~= "" then
      if only then return nil end
      only = data
    end
  end
  return only
end

local function cdp_send(conn, method, params, cb)
  conn.next_id = conn.next_id + 1
  if cb then conn.pending[conn.next_id] = cb end
  local msg = { id = conn.next_id, method = method }
  if params then msg.params = params end
  return ws_send_text(conn, json_encode(msg))
end

local script_snapshot = nil

local function first_snapshot()
  if script_snapshot then return script_snapshot end
  for data in pairs(sources) do
    if data.snapshot then return data.snapshot end
  end
  return nil
end

local function inject(conn, snapshot, owner)
  if not snapshot then return end
  local bundle = build_bundle(snapshot)
  if not bundle then return end
  conn.src = owner
  cdp_send(conn, "Page.enable", nil, function()
    -- Keep the renderer in the active lifecycle so CEF does not background-throttle.
    cdp_send(conn, "Page.setWebLifecycleState", { state = "active" })
    local function add_and_run()
      cdp_send(conn, "Page.addScriptToEvaluateOnNewDocument", { source = bundle }, function(result)
        conn.script_id = result and result.identifier or nil
        cdp_send(conn, "Runtime.evaluate", { expression = bundle }, function()
          log("themed: " .. tostring(conn.url))
          -- Detach the debugger. A live CDP session keeps Chromium in a slower path.
          conn.detach = true
        end)
      end)
    end
    if conn.script_id then
      cdp_send(conn, "Page.removeScriptToEvaluateOnNewDocument", { identifier = conn.script_id }, add_and_run)
      conn.script_id = nil
    else
      add_and_run()
    end
  end)
end

local function discover()
  local list, err = http_json_list(DEBUG_HOST, DEBUG_PORT)
  if not list then
    if port_reachable then
      port_reachable = false
      log("lost contact with OBS debug port " .. DEBUG_PORT)
    else
      port_misses = port_misses + 1
      if port_misses == 1 or port_misses % 15 == 0 then
        log("debug port " .. DEBUG_PORT .. " is closed. OBS was not started with the theming flags. Quit OBS (OBS menu → Quit), choose Run Normally if asked about Safe Mode, then open Launch OBS Themed.app — not the regular OBS icon.")
      end
    end
    return
  end
  port_misses = 0
  if not port_reachable then
    port_reachable = true
    log("connected to OBS debug port " .. DEBUG_PORT .. " (" .. tostring(#list) .. " pages)")
    for _, t in ipairs(list) do
      log("  " .. tostring(t.type) .. " " .. tostring(t.url or ""))
    end
    if after_port_up then pcall(after_port_up) end
  end
  for _, t in ipairs(list) do
    if t.type == "page" and t.webSocketDebuggerUrl and is_vixi_url(t.url or "")
      and not conns[t.webSocketDebuggerUrl] and not injected[t.webSocketDebuggerUrl] then
      local owner = find_source_for_url(t.url)
      local snapshot = (owner and owner.snapshot) or first_snapshot()
      if snapshot then
        local path = t.webSocketDebuggerUrl:match("ws://[^/]+(/.*)$")
        local conn, werr = ws_connect(DEBUG_HOST, DEBUG_PORT, path)
        if conn then
          conn.url = t.url
          conn.next_id = 0
          conn.pending = {}
          conns[t.webSocketDebuggerUrl] = conn
          inject(conn, snapshot, owner)
        else
          log("attach failed: " .. tostring(werr))
        end
      else
        log("no theme settings for " .. tostring(t.url) .. " — set them in Tools → Scripts → vixi-source.lua")
      end
    end
  end
end

local function pump()
  for key, conn in pairs(conns) do
    local msgs = ws_poll(conn)
    for _, raw in ipairs(msgs) do
      local msg = json_decode(raw)
      if msg and msg.id and conn.pending[msg.id] then
        local cb = conn.pending[msg.id]
        conn.pending[msg.id] = nil
        pcall(cb, msg.result, msg.error)
      end
    end
    if conn.detach or not conn.open then
      if conn.detach then injected[key] = true end
      ws_close(conn)
      conns[key] = nil
    end
  end
end

local discover_countdown = 0

local function push_themes()
  injected = {}
  local snap = first_snapshot()
  if snap then
    log("applying themes: message=" .. tostring(snap.message_theme) .. " mosaic=" .. tostring(snap.mosaic_theme))
  end
  discover()
end

local function reinject_source(_data)
  push_themes()
end

local function engine_tick()
  if shutting_down then return end
  local ok, err = pcall(function()
    pump()
    discover_countdown = discover_countdown - 1
    if discover_countdown <= 0 then
      discover_countdown = 10 -- every ~5s at a 500ms tick
      discover()
    end
  end)
  if not ok then
    log("engine error: " .. tostring(err))
  end
end

-- ======================================================================
-- OBS custom source
-- ======================================================================

if IS_OBS then
  math.randomseed(os.time())

  -- OBS color properties are 32-bit integers laid out as 0xAABBGGRR.
  local function color_to_hex(c)
    local r = c % 256
    local g = math.floor(c / 256) % 256
    local b = math.floor(c / 65536) % 256
    return string.format("#%02x%02x%02x", r, g, b)
  end

  local function snapshot_from_obs_data(settings)
    return {
      url = obs.obs_data_get_string(settings, "url"),
      enabled = obs.obs_data_get_bool(settings, "enabled"),
      message_theme = obs.obs_data_get_string(settings, "message_theme"),
      mosaic_theme = obs.obs_data_get_string(settings, "mosaic_theme"),
      override_colors = obs.obs_data_get_bool(settings, "override_colors"),
      primary_hex = color_to_hex(obs.obs_data_get_int(settings, "primary_color")),
      secondary_hex = color_to_hex(obs.obs_data_get_int(settings, "secondary_color")),
    }
  end

  local function apply_setting_defaults(settings)
    obs.obs_data_set_default_string(settings, "url", "")
    obs.obs_data_set_default_int(settings, "width", 1920)
    obs.obs_data_set_default_int(settings, "height", 1080)
    obs.obs_data_set_default_bool(settings, "enabled", true)
    obs.obs_data_set_default_string(settings, "message_theme", "holo-card")
    obs.obs_data_set_default_string(settings, "mosaic_theme", "decks")
    obs.obs_data_set_default_bool(settings, "override_colors", false)
    obs.obs_data_set_default_int(settings, "primary_color", 0xffff5c8b)
    obs.obs_data_set_default_int(settings, "secondary_color", 0xffffe03d)
  end

  local function add_theme_properties(props)
    local enabled = obs.obs_properties_add_bool(props, "enabled", "Theming enabled")

    obs.obs_properties_add_text(props, "msg_hdr", "Message items", obs.OBS_TEXT_INFO)
    local mt = obs.obs_properties_add_list(
      props, "message_theme", "Message theme",
      obs.OBS_COMBO_TYPE_LIST, obs.OBS_COMBO_FORMAT_STRING
    )
    for _, row in ipairs(MESSAGE_THEME_LABELS) do
      obs.obs_property_list_add_string(mt, row[1], row[2])
    end

    obs.obs_properties_add_text(props, "mosaic_hdr", "Mosaic items", obs.OBS_TEXT_INFO)
    local zt = obs.obs_properties_add_list(
      props, "mosaic_theme", "Mosaic theme",
      obs.OBS_COMBO_TYPE_LIST, obs.OBS_COMBO_FORMAT_STRING
    )
    for _, row in ipairs(MOSAIC_THEME_LABELS) do
      obs.obs_property_list_add_string(zt, row[1], row[2])
    end

    local function on_theme_changed(_props, _property, settings)
      script_snapshot = snapshot_from_obs_data(settings)
      push_themes()
      return true
    end
    obs.obs_property_set_modified_callback(mt, on_theme_changed)
    obs.obs_property_set_modified_callback(zt, on_theme_changed)
    obs.obs_property_set_modified_callback(enabled, on_theme_changed)

    local override = obs.obs_properties_add_bool(props, "override_colors", "Override theme colors")
    obs.obs_property_set_modified_callback(override, on_theme_changed)
    obs.obs_properties_add_color(props, "primary_color", "Primary color")
    obs.obs_properties_add_color(props, "secondary_color", "Secondary color")
    obs.obs_properties_add_button(props, "apply_themes", "Apply themes now", function()
      push_themes()
      return false
    end)

    local status
    if port_reachable then
      status = "Theming connection: OK on port " .. DEBUG_PORT
    else
      status = "Theming connection: NOT CONNECTED. Quit OBS, choose Run Normally if asked about Safe Mode, then open Launch OBS Themed.app (not the regular OBS icon)."
    end
    obs.obs_properties_add_text(props, "status_note", status, obs.OBS_TEXT_INFO)
  end

  local function bump_browser_fps()
    local list = obs.obs_enum_sources()
    if not list then return end
    for _, source in ipairs(list) do
      if obs.obs_source_get_id(source) == "browser_source" then
        local settings = obs.obs_source_get_settings(source)
        local url = obs.obs_data_get_string(settings, "url")
        if is_vixi_url(url) then
          local custom = obs.obs_data_get_bool(settings, "fps_custom")
          local fps = obs.obs_data_get_int(settings, "fps")
          if not custom or fps < 60 then
            obs.obs_data_set_bool(settings, "fps_custom", true)
            obs.obs_data_set_int(settings, "fps", 60)
            obs.obs_source_update(source, settings)
            log("set Browser Source frame rate to 60")
          end
        end
        obs.obs_data_release(settings)
      end
    end
    obs.source_list_release(list)
  end

  after_port_up = bump_browser_fps

  local source_def = {}
  source_def.id = "vixi_themed_output"
  source_def.type = obs.OBS_SOURCE_TYPE_INPUT
  source_def.output_flags = bit.bor(
    obs.OBS_SOURCE_VIDEO,
    obs.OBS_SOURCE_CUSTOM_DRAW,
    obs.OBS_SOURCE_DO_NOT_DUPLICATE
  )

  source_def.get_name = function()
    return "Vixi Themed Output"
  end

  source_def.get_defaults = function(settings)
    apply_setting_defaults(settings)
  end

  source_def.get_properties = function(_data)
    local props = obs.obs_properties_create()
    obs.obs_properties_add_text(
      props, "howto",
      "Settings only — hide this source (eye icon). Put the Vixi URL on a normal Browser Source in the scene. Themes apply to that Browser Source.",
      obs.OBS_TEXT_INFO
    )
    obs.obs_properties_add_text(props, "url", "Vixi output URL", obs.OBS_TEXT_DEFAULT)
    obs.obs_properties_add_int(props, "width", "Width", 2, 7680, 2)
    obs.obs_properties_add_int(props, "height", "Height", 2, 4320, 2)
    add_theme_properties(props)
    return props
  end

  source_def.create = function(settings, source)
    local data = { width = 2, height = 2, source = source }
    sources[data] = true
    source_def.update(data, settings)
    return data
  end

  source_def.destroy = function(data)
    sources[data] = nil
    for _, conn in pairs(conns) do
      if conn.src == data then conn.src = nil end
    end
  end

  source_def.update = function(data, settings)
    data.width = obs.obs_data_get_int(settings, "width")
    data.height = obs.obs_data_get_int(settings, "height")
    data.snapshot = snapshot_from_obs_data(settings)
    reinject_source(data)
  end

  source_def.video_render = function(_data, _effect)
  end

  source_def.get_width = function(data)
    return data.width
  end

  source_def.get_height = function(data)
    return data.height
  end

  obs.obs_register_source(source_def)

  function script_defaults(settings)
    apply_setting_defaults(settings)
  end

  function script_properties()
    local props = obs.obs_properties_create()
    obs.obs_properties_add_text(
      props, "howto",
      "Put the Vixi URL on a regular Browser Source. Pick themes here. Launch OBS with Launch OBS Themed.app.",
      obs.OBS_TEXT_INFO
    )
    obs.obs_properties_add_text(props, "url", "Vixi output URL (optional match)", obs.OBS_TEXT_DEFAULT)
    add_theme_properties(props)
    return props
  end

  function script_update(settings)
    script_snapshot = snapshot_from_obs_data(settings)
    push_themes()
  end

  function script_load(settings)
    shutting_down = false
    script_snapshot = snapshot_from_obs_data(settings)
    log("loaded — looking for debug port " .. DEBUG_PORT)
    bump_browser_fps()
    obs.timer_add(engine_tick, 500)
  end

  function script_unload()
    shutting_down = true
    obs.timer_remove(engine_tick)
    for key, conn in pairs(conns) do
      ws_close(conn)
      conns[key] = nil
    end
  end

  function script_description()
    return [[<b>Vixi themes for OBS</b><br/>
Themes a regular Browser Source that is showing a Vixi output URL.
Pick message/mosaic themes in this Scripts panel (or on a Vixi Themed
Output source — hide that source; it no longer displays video).<br/><br/>
<b>Launch OBS with Launch OBS Themed.app</b> (not the Dock / Applications
icon). If Safe Mode appears, choose <b>Run Normally</b>.]]
  end
end

-- ======================================================================
-- Test harness exports (only used outside OBS)
-- ======================================================================

if not IS_OBS then
  return {
    json_encode = json_encode,
    json_decode = json_decode,
    http_json_list = http_json_list,
    ws_connect = ws_connect,
    ws_send_text = ws_send_text,
    ws_poll = ws_poll,
    ws_close = ws_close,
    build_bundle = build_bundle,
    is_vixi_url = is_vixi_url,
  }
end
