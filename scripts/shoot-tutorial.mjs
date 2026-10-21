#!/usr/bin/env node
/**
 * Take the screenshots of tutorial.html with the Xcratch editor in headless Chromium.
 * Files of this repository (the extension and the tutorial projects) are served from
 * the local copy, so the screenshots show the current build.
 * Run: npm run tutorial && npm run build && npm run tutorial:shots
 */
import path from 'path';
import fs from 'fs-extra';
import {chromium} from 'playwright-core';

const ROOT = process.cwd();
const OUT = path.resolve(ROOT, 'tutorial');
const SITE = 'https://0x48lab.github.io/xcx-strudel/';
const EDITOR = 'https://xcratch.github.io/editor/';
const STEPS = 13;

/** Space around a shot, in CSS pixels. */
const PAD = 10;

/** Hide the grid, the scrollbars, the zoom buttons and the comments of the workspace. */
const CLEAN_CSS = `
.blocklyMainBackground { fill: #ffffff !important; }
.blocklyScrollbarHorizontal, .blocklyScrollbarVertical, .blocklyZoom { display: none !important; }
.scratchCommentRect, .scratchCommentTopBar, .scratchCommentResizeSE, .scratchCommentText,
.scratchCommentTarget, .scratchCommentLabel, .blocklyBlockCommentLine, g.scratchCommentWorkspace,
.blocklyBubbleCanvas > g { display: none !important; }
`;

const MIME = {'.mjs': 'text/javascript', '.js': 'text/javascript', '.sb3': 'application/octet-stream'};

const launch = async () => {
    const browser = await chromium.launch({args: ['--autoplay-policy=no-user-gesture-required']});
    const page = await browser.newPage({viewport: {width: 3800, height: 1300}, deviceScaleFactor: 2, locale: 'ja-JP'});
    // serve this repository instead of GitHub Pages
    await page.route(`${SITE}**`, route => {
        const file = path.join(ROOT, new URL(route.request().url()).pathname.replace('/xcx-strudel/', ''));
        if (!fs.existsSync(file)) return route.continue();
        return route.fulfill({
            status: 200,
            headers: {'Access-Control-Allow-Origin': '*'},
            contentType: MIME[path.extname(file)] || 'application/octet-stream',
            body: fs.readFileSync(file)
        });
    });
    return {browser, page};
};

const open = async (page, project) => {
    // a change of the hash only does not load the editor again
    await page.goto('about:blank');
    await page.goto(`${EDITOR}#${SITE}projects/tutorial/${project}.sb3`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.Blockly && Blockly.getMainWorkspace() &&
        Blockly.getMainWorkspace().getTopBlocks().length > 0, null, {timeout: 60000});
    await page.waitForTimeout(2500);
    await page.addStyleTag({content: CLEAN_CSS});
};

/**
 * Take a screenshot of a rectangle of the page.
 * @param {object} page - page
 * @param {object} rect - {x, y, width, height}
 * @param {string} name - file name without the extension
 */
const shot = async (page, rect, name) => {
    await page.screenshot({
        path: path.join(OUT, `${name}.png`),
        clip: {x: rect.x - PAD, y: rect.y - PAD, width: rect.width + (PAD * 2), height: rect.height + (PAD * 2)}
    });
    console.log(`  ${name}.png`);
};

/**
 * Take a screenshot of each script, one by one in the visible part of the workspace.
 * @param {object} page - page
 * @param {string} prefix - prefix of the file names
 */
const shootScripts = async (page, prefix) => {
    const count = await page.evaluate(() => Blockly.getMainWorkspace().getTopBlocks(true).length);
    for (let i = 0; i < count; i++) {
        const rect = await page.evaluate(index => {
            const ws = Blockly.getMainWorkspace();
            const tops = ws.getTopBlocks(true);
            tops.forEach((b, j) => {
                b.getSvgRoot().style.display = j === index ? '' : 'none';
            });
            const area = document.querySelector('.injectionDiv').getBoundingClientRect();
            const flyout = document.querySelector('.blocklyFlyout').getBoundingClientRect();
            let r = tops[index].getSvgRoot().getBoundingClientRect();
            // move the script to the upper left of the workspace
            const scale = ws.scale;
            tops[index].moveBy((flyout.right + 40 - r.left) / scale, (area.top + 40 - r.top) / scale);
            r = tops[index].getSvgRoot().getBoundingClientRect();
            return {x: r.left, y: r.top, width: r.width, height: r.height};
        }, i);
        await shot(page, rect, `${prefix}-${i + 1}`);
    }
};

/**
 * Take a screenshot of the stage.
 * @param {object} page - page
 * @param {string} name - file name
 */
const shootStage = async (page, name) => {
    const rect = await page.evaluate(() => {
        const r = document.querySelector('[class*="stage_stage_"] canvas').getBoundingClientRect();
        return {x: r.left, y: r.top, width: r.width, height: r.height};
    });
    await page.screenshot({path: path.join(OUT, `${name}.png`), clip: rect});
    console.log(`  ${name}.png`);
};

const rectOf = (page, selector) => page.$eval(selector, el => {
    const r = el.getBoundingClientRect();
    return {x: r.left, y: r.top, width: r.width, height: r.height};
});

/**
 * Draw a red ring around an element, inside the window.
 * @param {object} page - page
 * @param {string} selector - selector of the element
 */
const ring = (page, selector) => page.$eval(selector, el => {
    const r = el.getBoundingClientRect();
    const div = document.createElement('div');
    const left = Math.max(2, r.left - 6);
    const top = Math.max(2, r.top - 6);
    Object.assign(div.style, {
        position: 'fixed', left: `${left}px`, top: `${top}px`, zIndex: 9999, pointerEvents: 'none',
        width: `${Math.min(window.innerWidth - 2, r.right + 6) - left}px`,
        height: `${Math.min(window.innerHeight - 2, r.bottom + 6) - top}px`,
        border: '5px solid #ff4d6d', borderRadius: '10px', boxSizing: 'border-box'
    });
    div.id = 'tutorial-ring';
    document.body.appendChild(div);
});

/**
 * Draw a red ring around a rectangle.
 * @param {object} page - page
 * @param {object} rect - {x, y, width, height}
 */
const ringRect = (page, rect) => page.evaluate(r => {
    const div = document.createElement('div');
    Object.assign(div.style, {
        position: 'fixed', left: `${r.x - 6}px`, top: `${r.y - 6}px`, zIndex: 9999, pointerEvents: 'none',
        width: `${r.width + 12}px`, height: `${r.height + 12}px`,
        border: '5px solid #ff4d6d', borderRadius: '10px', boxSizing: 'border-box'
    });
    div.id = 'tutorial-ring';
    document.body.appendChild(div);
}, rect);

/** How to make a list, and a list on the stage. */
const shootLists = async page => {
    console.log('lists');
    await open(page, 'step9');
    const stage = await rectOf(page, '[class*="stage_stage_"]');
    await page.screenshot({path: path.join(OUT, 'stage-list.png'), clip: stage});
    console.log('  stage-list.png');
    await page.locator('.scratchCategoryMenuItemLabel', {hasText: /^変数$/}).first().click();
    await page.waitForTimeout(1500);
    const button = await page.locator('.blocklyFlyoutButton', {hasText: 'リストを作る'}).first().boundingBox();
    await ringRect(page, button);
    const flyout = await rectOf(page, '.blocklyFlyout');
    await shot(page, {x: flyout.x + PAD, y: button.y - 60, width: flyout.width - (PAD * 2), height: 420}, 'make-list');
    await page.$eval('#tutorial-ring', el => el.remove());
};

/** Where to record a voice in the sound tab. */
const shootRecord = async page => {
    console.log('record');
    await open(page, 'step10');
    await page.getByRole('tab', {name: '音', exact: true}).click();
    await page.waitForTimeout(1500);
    const main = page.locator('[class*="action-menu_main-button"][aria-label=" 音を選ぶ"]').first();
    await main.hover();
    await page.waitForTimeout(1200);
    await ringRect(page, await page.locator('[aria-label="録音する"]').first().boundingBox());
    const button = await main.boundingBox();
    await shot(page, {x: PAD, y: button.y - 300, width: 440, height: 300 + button.height}, 'record');
    await page.$eval('#tutorial-ring', el => el.remove());
};

/** How to add the extension. */
const shootSetup = async page => {
    console.log('setup');
    await page.goto(EDITOR, {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('[class*="extension-button"]', {timeout: 60000});
    await page.waitForTimeout(2000);
    await ring(page, '[class*="extension-button"]');
    const button = await rectOf(page, '[class*="extension-button"]');
    await shot(page, {x: button.x + PAD, y: button.y - 420, width: 620, height: button.height + 420 - PAD}, 'setup-1');
    await page.$eval('#tutorial-ring', el => el.remove());

    await page.click('[class*="extension-button"]');
    await page.waitForTimeout(2000);
    const tile = page.getByText('拡張機能を読み込む', {exact: true}).first();
    const item = tile.locator('xpath=ancestor::*[contains(@class, "library-item_library-item_")][1]');
    await item.evaluate(el => {
        el.style.outline = '6px solid #ff4d6d';
        el.style.outlineOffset = '2px';
    });
    const itemRect = await item.boundingBox();
    await shot(page, {x: 0 + PAD, y: 0 + PAD, width: itemRect.x + itemRect.width + 300, height: itemRect.y + itemRect.height + 20}, 'setup-2');

    await tile.click();
    await page.waitForSelector('#valueInput');
    await page.fill('#valueInput', `${SITE}dist/strudel.mjs`);
    const dialog = await page.$eval('#valueInput', el => {
        let box = el;
        // the box which has the title and the buttons
        while (box.parentElement && !(box.querySelectorAll('button').length >= 2 && box.textContent.includes('URL'))) {
            box = box.parentElement;
        }
        const r = box.getBoundingClientRect();
        return {x: r.left, y: r.top, width: r.width, height: r.height};
    });
    await shot(page, dialog, 'setup-3');
};

/** The palette of the extension, and the dropdown of sounds. */
const shootPalette = async page => {
    console.log('palette');
    await open(page, 'step1');
    await page.getByText('ストゥルーデル', {exact: true}).first().click();
    await page.waitForTimeout(1500);
    const toolbox = await rectOf(page, '.blocklyToolboxDiv');
    const flyout = await rectOf(page, '.blocklyFlyout');
    await shot(page, {x: toolbox.x + PAD, y: toolbox.y + PAD, width: flyout.x + flyout.width - toolbox.x - (PAD * 2),
        height: Math.min(900, toolbox.height) - (PAD * 2)}, 'palette');
    // the block which changes the level, for the top page
    const levelBlock = await page.evaluate(() => {
        const flyout = Blockly.getMainWorkspace().getFlyout().getWorkspace();
        const block = flyout.getTopBlocks(false).find(b => b.type === 'strudel_setLevel');
        const r = block.getSvgRoot().getBoundingClientRect();
        return {x: r.left, y: r.top, width: r.width, height: r.height};
    });
    await shot(page, levelBlock, 'level-block');

    // open the sound dropdown of the "play" block
    await shootScripts(page, 'step1');
    const field = await page.evaluate(() => {
        const ws = Blockly.getMainWorkspace();
        const play = ws.getAllBlocks().find(b => b.type === 'strudel_playTrack');
        const menu = play.getInputTargetBlock('PATTERN');
        const r = menu.getSvgRoot().getBoundingClientRect();
        return {x: r.left + (r.width / 2), y: r.top + (r.height / 2)};
    });
    await page.mouse.click(field.x, field.y);
    await page.waitForTimeout(800);
    const block = await page.evaluate(() => {
        const ws = Blockly.getMainWorkspace();
        const r = ws.getAllBlocks().find(b => b.type === 'strudel_playTrack').getSvgRoot().getBoundingClientRect();
        return {x: r.left, y: r.top, width: r.width, height: r.height};
    });
    const drop = await rectOf(page, '.blocklyDropDownDiv');
    const x = Math.min(block.x, drop.x);
    const y = Math.min(block.y, drop.y);
    await shot(page, {x, y, width: Math.max(block.x + block.width, drop.x + drop.width) - x,
        height: Math.min(1000, Math.max(block.y + block.height, drop.y + drop.height) - y)}, 'menu-sound');
    await page.keyboard.press('Escape');
};

/** Pictures of sound on the stage, while the music plays. */
const shootViz = async page => {
    console.log('stage');
    await open(page, 'step6');
    await page.click('[class*="green-flag"]');
    await page.waitForTimeout(5000);
    await shootStage(page, 'stage-pianoroll');
    // keys are sent to the stage
    await page.click('[class*="stage_stage_"] canvas');
    await page.keyboard.press('1');
    await page.waitForTimeout(1500);
    await shootStage(page, 'stage-scope');
    await page.keyboard.press('2');
    await page.waitForTimeout(1500);
    await shootStage(page, 'stage-spectrum');
    await page.click('[class*="stop-all"]');
};

fs.ensureDirSync(OUT);
const {browser, page} = await launch();
try {
    await shootSetup(page);
    await shootPalette(page);
    for (let step = 2; step <= STEPS; step++) {
        console.log(`step${step}`);
        await open(page, `step${step}`);
        await shootScripts(page, `step${step}`);
    }
    await shootLists(page);
    await shootRecord(page);
    await shootViz(page);
} finally {
    await browser.close();
}
