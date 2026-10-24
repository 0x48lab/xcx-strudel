#!/usr/bin/env node
/**
 * Make the dictionary: dictionary.html and en/dictionary.html, from the entries of dictionary-book.mjs
 * and the screenshots of scripts/shoot-dictionary.mjs.
 * Run: npm run dictionary (and npm run dictionary:shots before it when the examples change)
 */
import path from 'path';
import fs from 'fs-extra';
import {SECTIONS} from './dictionary-book.mjs';
import {bookStyle, headerButtons, imageOf} from './page-style.mjs';

const ROOT = process.cwd();
const translations = fs.readJsonSync(path.join(ROOT, 'src/vm/extensions/block/translations.json'));
const SITE = 'https://0x48lab.github.io/xcx-strudel/';
const EDITOR = 'https://xcratch.github.io/editor/';

const escape = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Strudel names of the blocks whose name is not the id of the entry; null for no Strudel function. */
const FUNCTIONS = {
    setLevel: null,
    track: '$:',
    stopTrack: 'hush',
    stopAll: 'hush',
    setBpm: 'setcpm',
    setBeatsPerCycle: 'setcpm',
    spriteSound: null,
    chord: null,
    effect: null,
    listMini: null,
    acidenv: null,
    trancegate: null,
    whenBeat: null,
    whenSound: null,
    beatInCycle: null,
    cycle: null,
    strudelCode: null,
    openStrudel: null,
    showViz: null,
    hideViz: null,
    vizLayer: null,
    setDrumKit: null
};

/** Menu groups whose labels are shown with the names of the items. */
const ITEM_MENUS = {effect: 'effect', showViz: 'viz'};

const TEXT = {
    ja: {
        title: 'Strudel for Xcratch ブロックじてん',
        h1: 'ブロックじてん',
        description: 'Strudel for Xcratch の ブロックの つかいかたと、名前(Strudel の 関数)の いみと ゆらい。',
        lead: 'この ブロック、どういう ときに つかうの? どうやって つかうの? を しらべよう。',
        other: {href: 'en/dictionary.html', label: 'English'},
        level: {1: 'ビギナー', 2: 'ノーマル', 3: 'マスター'},
        what: '何が 起きる?',
        tryIt: 'ためしてみよう',
        uses: 'よく つかう 場面',
        code: 'Strudel では',
        noCode: 'Strudel には ない、この 拡張だけの ブロック だよ。',
        items: 'えらべる 名前',
        itemName: '名前',
        itemWhat: '何が 起きる?',
        history: 'なまえと れきし',
        open: 'れいを ぜんぶ 開く',
        toc: 'さくいん',
        about: `
        <p>この じてんは、パレットの 上から じゅんばんに、<b>ブロック 1つ 1つの つかいかた</b>を しょうかいするよ。ブロックの 絵の とおりに 組んで、ためしてみよう。「れいを ぜんぶ 開く」で、じてんの れいが ぜんぶ 入った 作品が 開くよ。</p>
        <p>ブロックや ▼ は 日本語や カタカナで 書いてあるけど、ほとんどが <a href="https://strudel.cc/" target="_blank" rel="noopener">Strudel</a> の 関数に なっている(「はやくする」は <code>fast</code>、「アルペジオ」は <code>arp</code>)。見出しの となりの 名前が Strudel の 名前で、「なまえと れきし」を ひらくと、どこから 来た 名前かが わかるよ。</p>
        <p>「トラック [ ] で鳴らす」の 中の ブロックは、上から じゅんばんに Strudel の <code>.fast(4)</code> のような 1だんずつに なるよ。</p>
        <details class="history"><summary>Strudel の 名前は どこから 来たの?</summary>
        <p>Strudel の もとに なったのは、<b>TidalCycles</b>(タイダルサイクルズ)という 音楽の プログラミング言語だよ。イギリスの <b>Alex McLean</b>(アレックス・マクリーン)さんが 2009年ごろに Haskell という 言語で つくり、その場で コードを 書きかえながら 演奏する「<b>ライブコーディング</b>」の 道具として 世界中で つかわれてきた。</p>
        <p>2022年、<b>Felix Roos</b>(フェリックス・ロース)さんと Alex McLean さんが、TidalCycles の しくみを JavaScript に うつして、ブラウザだけで 鳴らせるように した。これが Strudel だよ。だから <code>fast</code> <code>rev</code> <code>every</code> <code>jux</code> などの 名前の 多くは、TidalCycles から 受けついだ ものなんだ。「サイクル」で 時間を 数える 考えかたも、Tidal<b>Cycles</b> の 名前の とおりだね。</p>
        <p>音の 名前(<code>bd</code> <code>lpf</code> <code>sawtooth</code> など)は、もっと 古く、ドラムマシンや シンセサイザーの れきしから 来ているよ。</p>
        </details>`,
        back: '<a href="tutorial.html">チュートリアルへ</a> ・ <a href="rhythms.html">リズム図鑑</a> ・ <a href="./">Strudel for Xcratch</a>'
    },
    en: {
        title: 'Strudel for Xcratch block dictionary',
        h1: 'Block dictionary',
        description: 'How to use the blocks of Strudel for Xcratch, and what their names (Strudel functions) mean and where they come from.',
        lead: 'When do you use this block? How do you use it? Find out here.',
        other: {href: '../dictionary.html', label: '日本語'},
        level: {1: 'Beginner', 2: 'Normal', 3: 'Master'},
        what: 'What does it do?',
        tryIt: 'Try it',
        uses: 'When to use it',
        code: 'In Strudel',
        noCode: 'Strudel does not have it: it is a block of this extension.',
        items: 'Names you can use',
        itemName: 'Name',
        itemWhat: 'What does it do?',
        history: 'Name and history',
        open: 'Open all the examples',
        toc: 'Index',
        about: `
        <p>This dictionary shows <b>how to use each block</b>, from the top of the palette down. Build the blocks as in the pictures and try them. "Open all the examples" opens a project with all the examples of the dictionary.</p>
        <p>The names of the blocks and ▼ menus are the names of the functions and sounds of <a href="https://strudel.cc/" target="_blank" rel="noopener">Strudel</a>. Open "Name and history" to see where each name comes from.</p>
        <p>The blocks in "play on track [ ]", from top to bottom, become the steps such as <code>.fast(4)</code> of Strudel.</p>
        <details class="history"><summary>Where do Strudel's names come from?</summary>
        <p>Strudel is based on <b>TidalCycles</b>, a programming language for music. <b>Alex McLean</b> from the UK made it around 2009 in a language called Haskell. People all over the world use it for "<b>live coding</b>": playing music by changing the code while it runs.</p>
        <p>In 2022, <b>Felix Roos</b> and Alex McLean moved the ideas of TidalCycles into JavaScript, so it can play music right in your web browser. That is Strudel. So many names, like <code>fast</code> <code>rev</code> <code>every</code> <code>jux</code>, come from TidalCycles. Counting time in "cycles" also comes from the name Tidal<b>Cycles</b>.</p>
        <p>Sound names (like <code>bd</code> <code>lpf</code> <code>sawtooth</code>) are even older. They come from the history of drum machines and synthesizers.</p>
        </details>`,
        back: '<a href="tutorial.html">Tutorial</a> ・ <a href="rhythms.html">Rhythm book</a> ・ <a href="./">Strudel for Xcratch</a>'
    }
};

/** Style of the entries of the dictionary, added to the style of the pages. */
const STYLE = `
/* block dictionary */
.entry h3 { font-family: inherit; }
.entry h3 .fn { font-size: 14px; font-weight: normal; color: var(--muted); }
.example { display: grid; grid-template-columns: minmax(0, auto) minmax(220px, 1fr); gap: 8px 24px; align-items: start; }
.example figure { margin: 6px 0 0; overflow-x: auto; }
.example figure img { max-width: none; }
@media (max-width: 720px) { .example { grid-template-columns: 1fr; } }
.entry ul.uses { margin: 4px 0 0; padding-left: 1.4em; }
.items-wrap { overflow-x: auto; }
table.items { margin: 4px 0 0; font-size: 15px; }
table.items td:first-child { width: 34%; }
table.items td code { white-space: nowrap; }
table.items pre { margin: 6px 0 0; font-size: 13px; }
@media (max-width: 640px) {
    /* on phones, the name of each row is above its text */
    table.items thead { display: none; }
    table.items tr, table.items td { display: block; width: auto; }
    table.items td:first-child { width: auto; border-bottom: none; padding-bottom: 0; background: var(--code-bg); }
}
table.items tr { scroll-margin-top: 12px; }
table.items tr:target td { background: var(--try-bg); }
.entry h3 .fn code { font-size: 14px; }
details.history { margin: 8px 0 0; padding: 8px 12px; border-left: 4px solid var(--purple); background: var(--code-bg); border-radius: 0 8px 8px 0; font-size: 15px; }
details.history::before { content: none; }
details.history summary { cursor: pointer; font-weight: bold; font-size: 13px; color: var(--purple); }
details.history p { margin: 6px 0 0; }
`;

/**
 * Name of a block as it reads in the palette, with [ ] for its inputs.
 * @param {string} lang - 'ja' or 'en'
 * @param {object} entry - entry
 * @returns {string} - name
 */
const blockName = (lang, entry) => (entry.heading ? entry.heading[lang] :
    translations[lang][`strudel.${entry.label || entry.opcode}`].replace(/\[[A-Z]+\]/g, '[ ]').trim());

/**
 * @param {string} lang - 'ja' or 'en'
 * @param {object} entry - entry
 * @returns {string} - name for the index
 */
const shortName = (lang, entry) => blockName(lang, entry).replace(/\s+/g, ' ');

const functionName = entry => {
    if (Object.prototype.hasOwnProperty.call(FUNCTIONS, entry.id)) return FUNCTIONS[entry.id];
    return entry.id;
};

/**
 * The names in a menu of a block as a table.
 * @param {string} lang - 'ja' or 'en'
 * @param {object} t - texts of the page
 * @param {object} entry - entry with items
 * @returns {string} - HTML
 */
const itemsHtml = (lang, t, entry) => {
    const menu = ITEM_MENUS[entry.id];
    const nameOf = item => {
        const labels = menu && lang !== 'en' ? item.name.split(' ')
            .map(name => translations[lang][`strudel.menu.${menu}.${name}`]).filter(Boolean) : [];
        const names = item.name.split(' ').map(name => `<code>${escape(name)}</code>`).join(' ');
        return labels.length ? `<b>${escape(labels.join(' / '))}</b><br>${names}` : names;
    };
    const rows = entry.items.map(item => `
                    <tr id="${item.id}"><td>${nameOf(item)}</td><td>${item.what[lang]}` +
        `<pre><code>${escape(item.code)}</code></pre></td></tr>`)
        .join('');
    return `
            <p class="label">${t.items}</p>
            <div class="items-wrap"><table class="items">
                <thead><tr><th>${t.itemName}</th><th>${t.itemWhat}</th></tr></thead>
                <tbody>${rows}
                </tbody>
            </table></div>`;
};

const entryHtml = (lang, t, entry) => {
    const image = `dictionary/${lang === 'en' ? 'en/' : ''}${entry.id}.png`;
    const {width, height, hash} = imageOf(path.join(ROOT, image));
    const src = `${lang === 'en' ? '../' : ''}${image}?v=${hash}`;
    const fn = functionName(entry);
    const code = entry.code ?
        `<p class="label">${t.code}</p>\n            <pre><code>${escape(entry.code)}</code></pre>` :
        `<p class="label">${t.code}</p>\n            <p class="note">${t.noCode}</p>`;
    const items = entry.items ? itemsHtml(lang, t, entry) : '';
    // the history of the names in the menu is in the history of the block, so that an entry has one history
    const histories = (entry.items || []).map(item => `<p><b>${escape(item.name)}</b>: ${item.history[lang]}</p>`).join('');
    return `
        <article class="entry" id="${entry.id}">
            <h3>${escape(blockName(lang, entry))}${fn ? ` <span class="fn">Strudel: <code>${escape(fn)}</code></span>` : ''} <span class="badge l${entry.level}">${t.level[entry.level]}</span></h3>
            <div class="example">
                <figure><img src="${src}" width="${width}" height="${height}" alt="${escape(blockName(lang, entry))}" loading="lazy"></figure>
                <div>
                    <p class="label">${t.what}</p>
                    <p>${entry.what[lang]}</p>
                    <p class="label">${t.tryIt}</p>
                    <p>${entry.result[lang]}</p>
                </div>
            </div>
            <p class="label">${t.uses}</p>
            <ul class="uses">${entry.uses[lang].map(use => `<li>${use}</li>`).join('')}</ul>
            ${code}${items}
            <details class="history"><summary>${t.history}</summary><p>${entry.history[lang]}</p>${histories}</details>
        </article>`;
};

const page = lang => {
    const t = TEXT[lang];
    const up = lang === 'en' ? '../' : '';
    const project = `${EDITOR}#${SITE}projects/${lang === 'en' ? 'en/' : ''}dictionary.sb3`;
    const toc = SECTIONS.map(section => `
        <h3><a href="#${section.id}">${escape(section.title[lang])}</a></h3>
        <ul class="toc">${section.entries.map(e => `<li><a href="#${e.id}">${escape(shortName(lang, e))}</a></li>`).join('')}</ul>`)
        .join('');
    const sections = SECTIONS.map(section => `
    <section class="card" id="${section.id}">
        <h2>${escape(section.title[lang])}</h2>${section.lead ? `\n        <p>${section.lead[lang]}</p>` : ''}${section.entries.map(e => entryHtml(lang, t, e)).join('')}
    </section>`).join('');
    return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<link rel="icon" href="${up}icon.svg" type="image/svg+xml">
<link rel="alternate" hreflang="ja" href="${SITE}dictionary.html">
<link rel="alternate" hreflang="en" href="${SITE}en/dictionary.html">
<meta name="description" content="${escape(t.description)}">
<!-- made by scripts/make-dictionary-page.mjs from scripts/dictionary-book.mjs: edit them, not this file -->
<style>${bookStyle()}${STYLE}</style>
</head>
<body>
<header>
    <p class="lang"><a href="${t.other.href}" data-keep-hash>${t.other.label}</a></p>
    <img src="${up}icon.svg" alt="" width="64" height="64" style="display:block;margin:0 auto 8px">
    <h1>${t.h1}</h1>
    <p>${t.lead}</p>
${headerButtons(lang, 'dictionary.html')}
</header>
<main>
    <section class="card" id="about">${t.about}
        <div class="buttons"><a class="button" href="${project}" target="_blank" rel="noopener">${t.open}</a></div>
    </section>
    <nav class="card" aria-label="${t.toc}">
        <h2>${t.toc}</h2>${toc}
    </nav>${sections}
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

fs.writeFileSync(path.join(ROOT, 'dictionary.html'), page('ja'));
fs.writeFileSync(path.join(ROOT, 'en/dictionary.html'), page('en'));
console.log('made dictionary.html and en/dictionary.html');
