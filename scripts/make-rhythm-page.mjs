#!/usr/bin/env node
/**
 * Make the rhythm book: rhythms.html and en/rhythms.html, from the rhythms and techniques of rhythm-book.mjs.
 * The style is the one of dictionary.html, so that the pages look the same.
 * Run: npm run rhythms
 */
import path from 'path';
import fs from 'fs-extra';
import {BREAK, DRUMS, RHYTHMS, STEPS, TECHNIQUES, gridOf} from './rhythm-book.mjs';
import {WORDS} from './words-en.mjs';

const ROOT = process.cwd();
const translations = fs.readJsonSync(path.join(ROOT, 'src/vm/extensions/block/translations.json'));
const SITE = 'https://0x48lab.github.io/xcx-strudel/';
const EDITOR = 'https://xcratch.github.io/editor/';

const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Texts of the page in each language. */
const TEXT = {
    ja: {
        lang: 'ja',
        title: 'Strudel for Xcratch リズム図鑑',
        h1: 'リズム図鑑',
        description: '定番の ドラムの リズムと、リズムを かっこよく する テクニックを、Strudel for Xcratch の ブロックで 鳴らして 改造しよう。',
        lead: '定番の リズムを 鳴らして、改造して、じぶんの 曲に しよう。',
        home: 'Strudel for Xcratch',
        tutorial: 'チュートリアル',
        dictionary: '関数じてん',
        other: {href: 'en/rhythms.html', label: 'English'},
        level: {2: 'ノーマル', 3: 'マスター'},
        key: 'キー',
        blocks: 'ブロック',
        code: 'Strudel では',
        tryIt: '改造してみよう',
        history: 'なまえと れきし',
        track: name => `「${name}」トラック`,
        about: `
        <h2>図鑑の 見かた</h2>
        <p>この 図鑑の リズムは、どれも <b>1サイクルが 1小節</b>(4拍)だよ。1拍を 4つに わけた <b>16マス</b>で、どこで 音が 鳴るかを 図に しているよ。上の 数字が マスの 番号(0〜15)で、色が ついた マスで 音が 鳴る。</p>
        <h3>リズムの 2つの 書きかた</h3>
        <p><b>同じ 間かくで くりかえす</b> ときは、「音」の 欄に <code>*</code> で 書く。<code>bd*4</code> は 1拍ずつ 4回、<code>[~ oh]*4</code> は 拍の あいだ(裏)で 4回。</p>
        <p><b>ばらばらの 場所で 鳴らす</b> ときは、「マスで鳴らす」に マスの 番号を 書く。<code>0,7,10</code> なら 0番目、7番目、10番目の マスで 鳴るよ。</p>
        <p>ならべる ことと <code>*</code> の ちがいも おぼえておこう。<code>sd sd sd sd</code> と <code>sd*4</code> は 同じ 音に なる けれど、<code>sd*4 hh</code> は <b>前半に sd が 4つ、後半に hh</b> に なる。<b>ならべた 数が 区切りの 数</b>で、<code>*</code> は <b>1つの 区切りの 中を こまかく する</b> んだ。</p>
        <p class="note">Xcratch では、13文字 以上の 欄は 12文字と「…」に 省略して 表示される。だから この 図鑑では、楽器ごとに「重ねる」で 分けて、1つの 欄を 12文字 までに しているよ。</p>`,
        rhythmsTitle: '定番の リズム',
        rhythmsLead: '「リズムを 鳴らす」の 作品を 開いて 緑の旗を おすと ハウスが 鳴り、1〜8 キーで リズムが かわるよ。リズムは「ドラム」トラック 1本に 入っているので、欄の 文字や マスの 番号を かえて 改造してみよう。',
        openRhythms: 'リズムを 鳴らす',
        techniquesTitle: 'テクニック',
        techniquesLead: '「テクニックを ためす」の 作品を 開いて 緑の旗を おすと、ハウスの 4つ打ち(「キック」「ハイハット」「クラップ」トラック)が 鳴る。1〜7 キーで テクニックを 1つずつ 足して、ちがいを 聞きくらべよう。スペースで もとに もどるよ。',
        openTechniques: 'テクニックを ためす',
        more: 'ほかの わざ: キックで ほかの 音を へこませる「ポンピング」と、だんだん もりあげる「ビルドアップ」は、<a href="tutorial.html#step13">チュートリアル 13章</a>に あるよ。',
        breakNote: `${BREAK.breakKey} キーと ${BREAK.dropKey} キー(「トラック [キック] を止める」と「トラック [キック] で鳴らす」)`,
        toc: 'さくいん',
        back: '<a href="tutorial.html">チュートリアルへ</a> ・ <a href="dictionary.html">関数じてん</a> ・ <a href="./">Strudel for Xcratch</a>'
    },
    en: {
        lang: 'en',
        title: 'Strudel for Xcratch rhythm book',
        h1: 'Rhythm book',
        description: 'Standard drum rhythms and techniques which make rhythms cool. Play them and remake them with the blocks of Strudel for Xcratch.',
        lead: 'Play standard rhythms, remake them, and make them your own songs.',
        home: 'Strudel for Xcratch',
        tutorial: 'Tutorial',
        dictionary: 'Function dictionary',
        other: {href: '../rhythms.html', label: '日本語'},
        level: {2: 'Normal', 3: 'Master'},
        key: 'Key',
        blocks: 'Blocks',
        code: 'In Strudel',
        tryIt: 'Remake it',
        history: 'Name and history',
        track: name => `track "${name}"`,
        about: `
        <h2>How to read this book</h2>
        <p>Every rhythm in this book is <b>one bar (4 beats) in a cycle</b>. A beat is cut into 4, so a bar has <b>16 steps</b>, and the pictures show on which steps the sounds play. The numbers on the top are the step numbers (0-15), and the sounds play on the colored steps.</p>
        <h3>Two ways to write a rhythm</h3>
        <p>When a sound <b>repeats at the same distance</b>, write it with <code>*</code> in the s block: <code>bd*4</code> plays on each of the 4 beats, <code>[~ oh]*4</code> plays 4 times between the beats (on the off-beats).</p>
        <p>When a sound plays <b>here and there</b>, write the step numbers in the beat block: <code>0,7,10</code> plays on steps 0, 7 and 10.</p>
        <p>Know the difference between a list and <code>*</code> too. <code>sd sd sd sd</code> and <code>sd*4</code> sound the same, but <code>sd*4 hh</code> plays <b>four sd in the first half and hh in the second half</b>. <b>The number of items is the number of parts</b>, and <code>*</code> <b>cuts one part finer</b>.</p>
        <p class="note">Xcratch shows an input of 13 letters or more as 12 letters and "…". So this book puts each instrument in its own stack and keeps each input to 12 letters.</p>`,
        rhythmsTitle: 'Standard rhythms',
        rhythmsLead: 'Open the project "Play the rhythms" and click the green flag: house plays, and keys 1-8 change the rhythm. A rhythm is one "drums" track, so change the text and the step numbers to remake it.',
        openRhythms: 'Play the rhythms',
        techniquesTitle: 'Techniques',
        techniquesLead: 'Open the project "Try the techniques" and click the green flag: the house beat (tracks "kick", "hats" and "clap") plays. Add the techniques one by one with keys 1-7 and hear the difference. Space goes back.',
        openTechniques: 'Try the techniques',
        more: 'More tricks: pumping, where the kick pushes the other sounds down, and the build-up are in <a href="tutorial.html#step13">step 13 of the tutorial</a>.',
        breakNote: `Keys ${BREAK.breakKey} and ${BREAK.dropKey} (stop track [kick] and play on track [kick])`,
        toc: 'Contents',
        back: '<a href="tutorial.html">Tutorial</a> ・ <a href="dictionary.html">Function dictionary</a> ・ <a href="./">Strudel for Xcratch</a>'
    }
};

/** Style of the grids and the blocks, added to the style of dictionary.html. */
const STYLE = `
/* rhythm book */
.grid { border-collapse: separate; border-spacing: 2px; width: auto; margin: 8px 0; font-size: 13px; }
.grid th, .grid td { border: none; padding: 0; background: none; }
.grid th { padding-right: 8px; font-weight: normal; white-space: nowrap; text-align: right; color: var(--muted); }
.grid thead th { text-align: center; padding: 0; font-size: 11px; }
.grid td { width: 18px; height: 18px; border-radius: 4px; background: var(--code-bg); }
.grid td.beat { background: var(--border); }
.grid td.on { background: var(--accent); }
.grid td.on.alt { background: var(--purple); }
.grid-wrap { overflow-x: auto; }
.blocks { margin: 6px 0 0; padding: 8px 12px; list-style: none; border-radius: 8px; background: var(--code-bg); font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; }
.blocks ul { margin: 0; padding-left: 1.4em; list-style: none; border-left: 3px solid var(--border); }
.slot { display: inline-block; padding: 0 6px; margin: 0 2px; border-radius: 999px; background: var(--card); border: 1px solid var(--border); font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
.badge.bpm { background: #4c97ff; }
.badge.key { background: var(--muted); }
`;

/**
 * A block as it reads in the editor, with its inputs filled.
 * @param {string} lang - 'ja' or 'en'
 * @param {string} opcode - opcode
 * @param {object} args - inputs
 * @returns {string} - HTML
 */
const blockText = (lang, opcode, args) => {
    const t = translations[lang];
    const menu = (group, value) => t[`strudel.menu.${group}.${value}`] || value;
    const value = (name, v) => {
        if (v && v.wave) {
            const [shape, min, max, cycles] = v.wave;
            return `(${blockText(lang, 'wave', {SHAPE: shape, MIN: min, MAX: max, CYCLES: cycles})})`;
        }
        if (name === 'EFFECT') return menu('effect', v);
        if (name === 'TRANSFORM') return menu('transform', v);
        if (name === 'SHAPE') return menu('shape', v);
        return v;
    };
    return escape(t[`strudel.${opcode}`]).replace(/\[([A-Z]+)\]/g, (whole, name) => {
        const v = value(name, args[name]);
        return v && v.startsWith && v.startsWith('(') ? v : `<span class="slot">${escape(v)}</span>`;
    });
};

/**
 * Blocks of a track in the C block "play on track".
 * @param {string} lang - 'ja' or 'en'
 * @param {string} name - track name
 * @param {Array} track - blocks
 * @returns {string} - HTML
 */
const blocksHtml = (lang, name, track) => {
    const list = steps => `<ul>${steps.map(([opcode, args, inner]) => `<li>${blockText(lang, opcode, args)}` +
        `${inner ? list(inner) : ''}</li>`).join('')}</ul>`;
    return `<ul class="blocks"><li>${blockText(lang, 'track', {TRACK: name})}${list(track)}</li></ul>`;
};

/**
 * @param {string} lang - 'ja' or 'en'
 * @param {Array} track - blocks of a rhythm
 * @returns {string} - HTML of the grid
 */
const gridHtml = (lang, track) => {
    const numbers = Array.from({length: STEPS}, (_, i) => `<th>${i}</th>`);
    const rows = gridOf(track).map((row, r) => {
        const cells = Array.from({length: STEPS}, (_, i) => {
            const classes = [];
            if (i % 4 === 0) classes.push('beat');
            if (row.steps.includes(i)) classes.push('on');
            if (row.steps.includes(i) && r % 2) classes.push('alt');
            return `<td${classes.length ? ` class="${classes.join(' ')}"` : ''}></td>`;
        });
        return `<tr><th>${escape(DRUMS[row.sound][lang])}</th>${cells.join('')}</tr>`;
    });
    return `<div class="grid-wrap"><table class="grid"><thead><tr><th></th>${numbers.join('')}</tr></thead>` +
        `<tbody>${rows.join('')}</tbody></table></div>`;
};

const tipsHtml = (t, tips) => `<div class="try"><strong>${t.tryIt}</strong><ul>${tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>`;

const openUrl = (lang, project) => `${EDITOR}#${SITE}projects/${lang === 'en' ? 'en/' : ''}${project}.sb3`;

const trackName = (lang, name) => (lang === 'en' ? WORDS[name] : name);

const page = lang => {
    const t = TEXT[lang];
    const up = lang === 'en' ? '../' : '';
    const rhythms = RHYTHMS.map(r => `
        <article class="entry" id="${r.id}">
            <h3>${escape(r.name[lang])} <span class="badge bpm">BPM ${r.bpm}</span> <span class="badge key">${t.key} ${r.key}</span></h3>
            ${gridHtml(lang, r.track)}
            <p>${r.about[lang]}</p>
            <p class="label">${t.blocks}</p>
            ${blocksHtml(lang, trackName(lang, 'ドラム'), r.track)}
            <p class="label">${t.code}</p>
            <pre><code>${escape(r.code)}</code></pre>
            ${tipsHtml(t, r.tips[lang])}
            <p class="history" data-label="${t.history}">${r.history[lang]}</p>
        </article>`).join('');
    const techniques = TECHNIQUES.map(x => `
        <article class="entry" id="${x.id}">
            <h3>${escape(x.name[lang])} <span class="badge l${x.level}">${t.level[x.level]}</span> <span class="badge key">${t.key} ${x.key}</span></h3>
            <p>${x.about[lang]}</p>
            <p class="label">${t.blocks}(${escape(t.track(trackName(lang, x.trackName)))})</p>
            ${blocksHtml(lang, trackName(lang, x.trackName), x.track)}
            <p class="label">${t.code}</p>
            <pre><code>${escape(x.code)}</code></pre>
            ${tipsHtml(t, x.tips[lang])}
        </article>`).join('') + `
        <article class="entry" id="break">
            <h3>${escape(BREAK.name[lang])} <span class="badge l2">${t.level[2]}</span> <span class="badge key">${t.key} ${BREAK.breakKey} ${BREAK.dropKey}</span></h3>
            <p>${BREAK.about[lang]}</p>
            <p class="blockline">${t.breakNote}</p>
            ${tipsHtml(t, BREAK.tips[lang])}
        </article>`;
    const toc = (items, extra = []) => `<ul class="toc">${items.map(x => `<li><a href="#${x.id}">${escape(x.name[lang])}</a></li>`)
        .concat(extra).join('')}</ul>`;
    const style = fs.readFileSync(path.join(ROOT, 'dictionary.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
    return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<link rel="icon" href="${up}icon.svg" type="image/svg+xml">
<link rel="alternate" hreflang="ja" href="${SITE}rhythms.html">
<link rel="alternate" hreflang="en" href="${SITE}en/rhythms.html">
<meta name="description" content="${escape(t.description)}">
<!-- made by scripts/make-rhythm-page.mjs from scripts/rhythm-book.mjs: edit them, not this file -->
<style>${style}${STYLE}</style>
</head>
<body>
<header>
    <p class="lang"><a href="${t.other.href}" data-keep-hash>${t.other.label}</a></p>
    <img src="${up}icon.svg" alt="" width="64" height="64" style="display:block;margin:0 auto 8px">
    <h1>${t.h1}</h1>
    <p>${t.lead}<br><a href="./">${t.home}</a> ・ <a href="tutorial.html">${t.tutorial}</a> ・ <a href="dictionary.html">${t.dictionary}</a></p>
</header>
<main>
    <section class="card" id="about">${t.about}
        <div class="buttons">
            <a class="button" href="${openUrl(lang, 'rhythms')}" target="_blank" rel="noopener">${t.openRhythms}</a>
            <a class="button secondary" href="${openUrl(lang, 'techniques')}" target="_blank" rel="noopener">${t.openTechniques}</a>
        </div>
    </section>
    <nav class="card" aria-label="${t.toc}">
        <h2>${t.toc}</h2>
        <h3><a href="#rhythms">${t.rhythmsTitle}</a></h3>
        ${toc(RHYTHMS)}
        <h3><a href="#techniques">${t.techniquesTitle}</a></h3>
        ${toc(TECHNIQUES, [`<li><a href="#break">${escape(BREAK.name[lang])}</a></li>`])}
    </nav>
    <section class="card" id="rhythms">
        <h2>${t.rhythmsTitle}</h2>
        <p>${t.rhythmsLead}</p>
        <div class="buttons"><a class="button" href="${openUrl(lang, 'rhythms')}" target="_blank" rel="noopener">${t.openRhythms}</a></div>${rhythms}
    </section>
    <section class="card" id="techniques">
        <h2>${t.techniquesTitle}</h2>
        <p>${t.techniquesLead}</p>
        <div class="buttons"><a class="button" href="${openUrl(lang, 'techniques')}" target="_blank" rel="noopener">${t.openTechniques}</a></div>${techniques}
        <p class="note">${t.more}</p>
    </section>
    <p style="text-align:center">${t.back}</p>
</main>
<footer>
    <p><a href="./">Strudel for Xcratch</a> — <a href="https://github.com/0x48lab/xcx-strudel/blob/main/LICENSE">AGPL-3.0</a>.
    This extension bundles <a href="https://strudel.cc/">Strudel</a> (AGPL-3.0).</p>
</footer>
<script>
// keep the hash when switching the language
document.querySelectorAll('a[data-keep-hash]').forEach(a => a.addEventListener('click', () => { a.href = a.href.split('#')[0] + location.hash; }));
</script>
</body>
</html>
`;
};

fs.writeFileSync(path.join(ROOT, 'rhythms.html'), page('ja'));
fs.writeFileSync(path.join(ROOT, 'en/rhythms.html'), page('en'));
console.log('made rhythms.html and en/rhythms.html');
