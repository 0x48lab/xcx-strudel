/**
 * Take a screenshot of each script of a project with the Xcratch editor in headless Chromium,
 * for the pages which show blocks (the block dictionary and the rhythm book).
 * The files of this repository are served from the local copy, and the project from its file.
 */
import path from 'path';
import fs from 'fs-extra';
import {chromium} from 'playwright-core';

const ROOT = process.cwd();
const SITE = 'https://0x48lab.github.io/xcx-strudel/';
const EDITOR = 'https://xcratch.github.io/editor/';
const MIME = {'.mjs': 'text/javascript', '.js': 'text/javascript', '.sb3': 'application/octet-stream'};
/** URL at which the project is served. */
const PROJECT_URL = `${SITE}shoot-scripts.sb3`;

/** Space around a shot, in CSS pixels. */
const PAD = 10;

/** Hide the grid, the scrollbars and the zoom buttons of the workspace. */
const CLEAN_CSS = `
.blocklyMainBackground { fill: #ffffff !important; }
.blocklyScrollbarHorizontal, .blocklyScrollbarVertical, .blocklyZoom { display: none !important; }
`;

/**
 * @param {object} options - options
 * @param {string} options.project - sb3 file whose scripts are, from the top, the shots
 * @param {string} options.out - directory of the PNG files
 * @param {Array<{id: string, opcode: string}>} options.shots - name of the file and the opcode of the top block
 *     of each script, from the top. The opcodes check that each file gets the name of its script.
 * @param {boolean} options.en - English editor
 */
export const shootScripts = async ({project, out, shots, en}) => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: {width: 2400, height: 1300}, deviceScaleFactor: 2, locale: en ? 'en-US' : 'ja-JP'
    });
    // serve this repository instead of GitHub Pages
    await page.route(`${SITE}**`, route => {
        const url = route.request().url();
        const file = url === PROJECT_URL ? project :
            path.join(ROOT, new URL(url).pathname.replace('/xcx-strudel/', ''));
        if (!fs.existsSync(file)) return route.continue();
        return route.fulfill({
            status: 200,
            headers: {'Access-Control-Allow-Origin': '*'},
            contentType: MIME[path.extname(file)] || 'application/octet-stream',
            body: fs.readFileSync(file)
        });
    });
    await page.goto(`${EDITOR}#${PROJECT_URL}`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.Blockly && Blockly.getMainWorkspace() &&
        Blockly.getMainWorkspace().getTopBlocks().length > 0, null, {timeout: 90000});
    await page.waitForTimeout(2500);
    await page.addStyleTag({content: CLEAN_CSS});

    // the order of the scripts from the top, before the loop below moves them
    const found = await page.evaluate(() => {
        window.shotTops = Blockly.getMainWorkspace().getTopBlocks(true);
        return window.shotTops.map(block => block.type);
    });
    const expected = shots.map(shot => shot.opcode);
    if (JSON.stringify(found) !== JSON.stringify(expected)) {
        throw new Error(`the scripts are not in the order of the shots:\n${found}\n${expected}`);
    }
    fs.ensureDirSync(out);
    for (let i = 0; i < shots.length; i++) {
        const rect = await page.evaluate(index => {
            const ws = Blockly.getMainWorkspace();
            const tops = window.shotTops;
            tops.forEach((b, j) => {
                b.getSvgRoot().style.display = j === index ? '' : 'none';
            });
            const area = document.querySelector('.injectionDiv').getBoundingClientRect();
            const flyout = document.querySelector('.blocklyFlyout').getBoundingClientRect();
            let r = tops[index].getSvgRoot().getBoundingClientRect();
            // move the script to the upper left of the workspace
            tops[index].moveBy((flyout.right + 40 - r.left) / ws.scale, (area.top + 40 - r.top) / ws.scale);
            r = tops[index].getSvgRoot().getBoundingClientRect();
            return {x: r.left, y: r.top, width: r.width, height: r.height};
        }, i);
        await page.screenshot({
            path: path.join(out, `${shots[i].id}.png`),
            clip: {x: rect.x - PAD, y: rect.y - PAD, width: rect.width + (PAD * 2), height: rect.height + (PAD * 2)}
        });
    }
    console.log(`took ${shots.length} screenshots in ${path.relative(ROOT, out)}`);
    await browser.close();
};
