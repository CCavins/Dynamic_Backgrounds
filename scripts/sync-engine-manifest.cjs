#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const extDir = path.join(root, "extension");
const manifestPath = path.join(extDir, "manifest.json");
const enginesPath = path.join(extDir, "engines.json");

const BEFORE = ["rules.js", "handoff.js", "content.js", "mosaic-themes.js", "message-themes.js"];
const AFTER = ["custom-themes.js", "mosaic.js", "message.js"];

function listedEngines() {
  const data = JSON.parse(fs.readFileSync(enginesPath, "utf8"));
  const names = Array.isArray(data.engines) ? data.engines : [];
  return names.map((name) => {
    const file = String(name).replace(/^engines\//, "").replace(/^.*[/\\]/, "");
    if (!file || file.includes("..") || !file.endsWith(".js")) {
      throw new Error("Invalid engine file name: " + name);
    }
    const full = path.join(extDir, "engines", file);
    if (!fs.existsSync(full)) {
      throw new Error("Missing engine file: engines/" + file);
    }
    return "engines/" + file;
  });
}

const idle = [...BEFORE, "engines/api.js", ...listedEngines(), ...AFTER];
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const scripts = manifest.content_scripts || [];
const idleEntry = scripts.find((entry) => Array.isArray(entry.js) && entry.js.includes("custom-themes.js"))
  || scripts.find((entry) => Array.isArray(entry.js) && entry.js.includes("message.js"));
if (!idleEntry) {
  throw new Error("Could not find the document_idle content_scripts entry.");
}
idleEntry.js = idle;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("Updated manifest content_scripts:\n  " + idle.join("\n  "));
