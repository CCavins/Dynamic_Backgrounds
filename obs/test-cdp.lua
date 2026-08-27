-- Test harness for the CDP client inside vixi-source.lua.
-- Run from the repo root against any Chromium with an open debug port:
--   chrome --headless --remote-debugging-port=9224 about:blank &
--   luajit obs/test-cdp.lua 9224
io.stdout:setvbuf("no")
local M = dofile("obs/vixi-source.lua")
local port = tonumber(arg and arg[1]) or 9224

local function fail(msg)
  print("FAIL: " .. msg)
  os.exit(1)
end

-- 1. JSON round-trip
local encoded = M.json_encode({ a = 1, b = "x\"y\n", c = { 1, 2, 3 }, d = true })
local decoded = M.json_decode(encoded)
assert(decoded.a == 1 and decoded.b == 'x"y\n' and decoded.c[2] == 2 and decoded.d == true, "json roundtrip")
assert(M.json_decode('{"u":"\\u0041\\ud83d\\ude00"}').u == "A\240\159\152\128", "json unicode")
print("PASS json codec")

-- 2. Target discovery over HTTP
local list = M.http_json_list("127.0.0.1", port)
if not list then fail("no /json/list response — is Chrome running with --remote-debugging-port=" .. port .. "?") end
local target
for _, t in ipairs(list) do
  if t.type == "page" and t.webSocketDebuggerUrl then target = t break end
end
if not target then fail("no page target found") end
print("PASS discovery: " .. target.url)

-- 3. WebSocket attach + Runtime.evaluate
local path = target.webSocketDebuggerUrl:match("ws://[^/]+(/.*)$")
local conn = M.ws_connect("127.0.0.1", port, path)
if not conn then fail("ws handshake") end
print("PASS ws handshake")

local next_id = 0
local function rpc(method, params, timeout)
  next_id = next_id + 1
  local id = next_id
  M.ws_send_text(conn, M.json_encode({ id = id, method = method, params = params or { _ = nil } }))
  local deadline = os.time() + (timeout or 5)
  while os.time() < deadline do
    for _, raw in ipairs(M.ws_poll(conn)) do
      local msg = M.json_decode(raw)
      if msg and msg.id == id then return msg.result, msg.error end
    end
  end
  return nil, { message = "timeout for " .. method }
end

local result, err = rpc("Runtime.evaluate", { expression = "6*7" })
if not result or result.result.value ~= 42 then fail("evaluate: " .. (err and err.message or "bad result")) end
print("PASS evaluate small")

-- 4. Large frame (>64KB payload exercises the 64-bit length path)
local big = string.rep("x", 100000)
result, err = rpc("Runtime.evaluate", { expression = "'" .. big .. "'.length" })
if not result or result.result.value ~= 100000 then fail("large frame: " .. (err and err.message or "bad result")) end
print("PASS evaluate large (100KB frame)")

-- 5. Full inject sequence: Page.enable + addScriptToEvaluateOnNewDocument + navigate
result, err = rpc("Page.enable")
if err then fail("Page.enable: " .. err.message) end
result, err = rpc("Page.addScriptToEvaluateOnNewDocument", { source = "window.__T__ = 'injected-early';" })
if not result or not result.identifier then fail("addScript: " .. (err and err.message or "no identifier")) end
print("PASS addScriptToEvaluateOnNewDocument (id " .. result.identifier .. ")")

rpc("Page.navigate", { url = "data:text/html,<title>t</title>" })
-- Give the navigation a moment, then confirm the early script ran.
local ok_injected = false
local deadline = os.time() + 5
while os.time() < deadline do
  local r = rpc("Runtime.evaluate", { expression = "window.__T__ || ''" }, 2)
  if r and r.result and r.result.value == "injected-early" then
    ok_injected = true
    break
  end
end
if not ok_injected then fail("injected script did not run on new document") end
print("PASS early injection survives navigation")

-- 6. Real bundle builds and evaluates without throwing
local bundle = M.build_bundle({
  url = "x", enabled = true, message_theme = "holo-card", mosaic_theme = "decks",
  override_colors = true, primary_hex = "#8b5cff", secondary_hex = "#3de0ff",
})
if not bundle then fail("bundle build (run from repo root so ./extension resolves)") end
result, err = rpc("Runtime.evaluate", { expression = bundle .. "; 'bundle-ok'" }, 10)
if not result or result.result.value ~= "bundle-ok" then
  fail("bundle evaluate: " .. (err and err.message or (result and M.json_encode(result) or "?")))
end
print("PASS real bundle (" .. #bundle .. " bytes) injected and ran")

M.ws_close(conn)
print("ALL TESTS PASSED")
