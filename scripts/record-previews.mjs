import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const framesRoot = path.join(root, '.preview-frames');
const outDir = path.join(root, 'previews');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const base = process.env.PREVIEW_BASE || 'http://127.0.0.1:8080/backgrounds';

const scenes = [
    { id: 'universe', wait: 4500 },
    { id: 'aurora', wait: 1200 },
    { id: 'synthwave', wait: 1200 },
    { id: 'fluid-ink', wait: 1200 },
    { id: 'plexus', wait: 1200 },
    { id: 'ocean', wait: 1200 },
    { id: 'fireflies', wait: 1200 },
    { id: 'lava-lamp', wait: 1200 },
    { id: 'matrix', wait: 1200 },
    { id: 'silk-waves', wait: 1200 },
    { id: 'clouds', wait: 1200 }
];

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(' ')} failed (${code})`));
        });
    });
}

async function encode(sceneId, frameDir) {
    const mp4 = path.join(outDir, `${sceneId}.mp4`);
    const pattern = path.join(frameDir, 'f%03d.png');

    await run('ffmpeg', [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', '10', '-i', pattern,
        '-vf', 'scale=640:-2:flags=lanczos',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', '-an',
        mp4
    ]);
}

const only = process.argv.slice(2);
const selected = only.length ? scenes.filter((scene) => only.includes(scene.id)) : scenes;

await mkdir(outDir, { recursive: true });
await rm(framesRoot, { recursive: true, force: true });

const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: [
        '--hide-scrollbars',
        '--use-angle=metal',
        '--enable-webgl',
        '--ignore-gpu-blocklist'
    ]
});

const page = await browser.newPage();
await page.setViewport({ width: 960, height: 480, deviceScaleFactor: 1 });

for (const scene of selected) {
    const frameDir = path.join(framesRoot, scene.id);
    await mkdir(frameDir, { recursive: true });
    const url = `${base}/${scene.id}.html?preview=1`;
    console.log(`Recording ${scene.id}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await page.waitForSelector('canvas, #canvas, #scene, #canvas-container canvas', { timeout: 20000 });
    await sleep(scene.wait);

    for (let i = 0; i < 24; i++) {
        await page.screenshot({
            path: path.join(frameDir, `f${String(i).padStart(3, '0')}.png`),
            type: 'png',
            captureBeyondViewport: false
        });
        await sleep(100);
    }

    await encode(scene.id, frameDir);
    console.log(`Wrote previews/${scene.id}.mp4`);
}

await browser.close();
await rm(framesRoot, { recursive: true, force: true });
console.log('Done.');
