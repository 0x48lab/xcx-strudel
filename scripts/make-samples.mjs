#!/usr/bin/env node
/**
 * Make sample projects: projects/melody.sb3 (standard level) and projects/trance.sb3 (master level).
 * Keys change the music at the next cycle, like live coding.
 * Run: npm run demo
 */
import path from 'path';
import {Blocks, strudelBlocks, writeProject} from './sb3-builder.mjs';
import {PIANO_RHYTHM, SOUL} from './soul-song.mjs';

const out = name => path.resolve(process.cwd(), `projects/${name}.sb3`);


/**
 * Hat block of a key with blocks under it.
 * @param {Blocks} b - builder
 * @param {string} key - key name
 * @param {Array<number>} top - position
 * @param {Array<string>} blocks - blocks under the hat
 */
const onKey = (b, key, top, blocks) => b.stack([b.whenKey(key, top), ...blocks]);

/**
 * Dance on every beat.
 * @param {Blocks} b - builder
 * @param {Array<number>} top - position
 */
const danceOnBeat = (b, top) => b.stack([b.strudel('whenBeat'), b.block('looks_nextcostume')]
    .map((id, i) => {
        if (i === 0) {
            b.blocks[id].topLevel = true;
            b.blocks[id].x = top[0];
            b.blocks[id].y = top[1];
        }
        return id;
    }));

// ---- melody: scales, the piano, effects (standard level) ----
const makeMelody = async () => {
    const b = new Blocks();
    const $ = strudelBlocks(b);
    const melody = (steps, ...after) => $.track('メロディ',
        [$.n(steps), $.scale('C4', 'major:pentatonic'), $.s('piano'), ...after]);

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const tempo = b.strudel('setBpm', {BPM: ['number', 100]});
    const drums = $.track('ドラム', [$.s('bd [~ bd] sd ~, [~ hh]*4')]);
    const bass = $.track('ベース', [$.note('<c2 a1 f1 g1>'), $.s('sawtooth'), $.effect('lpf', '700')]);
    const first = melody('0 2 4 <5 7>');
    const roll = b.strudel('showViz', {}, {VIZ: 'pianoroll'});
    const hint = b.say('スペース・↑・↓ キーで メロディが かわるよ。R キーで ひびきが つくよ。', 6);
    b.stack([flag, tempo, drums, bass, first, roll, hint]);
    b.comment(flag, 'おんかい(ヨナぬき)の ばんごうで メロディを つくるよ。\nピアノの おとは じどうで よみこまれるよ。', 1000, 24);

    onKey(b, 'space', [24, 640], [melody('<[0 2 4 2] [4 5 7 5]>')]);
    onKey(b, 'up arrow', [24, 860], [$.track('メロディ',
        [$.n('0 2 4 <5 7>'), $.add('<0 2 4>'), $.scale('C4', 'major:pentatonic'), $.s('piano')])]);
    onKey(b, 'down arrow', [24, 1100], [melody('0 2 4 <5 7>')]);
    onKey(b, 'r', [24, 1320], [melody('0 2 4 <5 7>', $.effect('room', '0.8'))]);
    b.comment(b.blocks && Object.keys(b.blocks).find(id => b.blocks[id].opcode === 'event_whenkeypressed'),
        'キーを おすと、つぎの サイクルの はじめで メロディが いれかわるよ。', 1000, 640);
    danceOnBeat(b, [24, 1560]);

    await writeProject(b, out('melody'), 'xcx-strudel make-samples');
};

// ---- trance: drum machine, acid, trance gate, layers by keys (master level) ----
const makeTrance = async () => {
    const b = new Blocks();
    const $ = strudelBlocks(b);
    const kick = () => $.track('キック', [$.s('bd*4'), $.bank('RolandTR909')]);
    const parts = [
        ['1', 'q', 'キック', kick],
        ['2', 'w', 'ハイハット', () => $.track('ハイハット', [$.s('[~ hh]*4, [~ cp]*2'), $.bank('RolandTR909')])],
        ['3', 'e', 'ベース', () => $.track('ベース', [$.note('a1*16'), $.add('<0 0 -4 -2>'), $.acidenv(0.6)])],
        ['4', 'r', 'パッド', () => $.track('パッド', [
            $.note('<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>'), $.s('supersaw'),
            $.trancegate(0.7, 12, 1), $.effect('lpf', '2000')
        ])],
        ['5', 't', 'リード', () => $.track('リード', [
            $.n('<0 2 4 7 4 2 1 -1>*8'), $.scale('A3', 'minor'), $.s('triangle'),
            $.superimpose('up12'), $.effect('delay', '.3')
        ])]
    ];

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const tempo = b.strudel('setBpm', {BPM: ['number', 138]});
    const spectrum = b.strudel('showViz', {}, {VIZ: 'spectrum'});
    const hint = b.say('1〜5 キーで パートを ふやそう。Q〜T で とめる、0 で ぜんぶ とめるよ。', 6);
    b.stack([flag, tempo, kick(), spectrum, hint]);
    b.comment(flag, 'キーで パートを かさねていく DJ あそび。\nアシッドベースと トランスゲートの パッドを つかっているよ。', 1100, 24);

    parts.forEach(([startKey, stopKey, track, start], i) => {
        onKey(b, startKey, [24, 300 + (i * 240)], [start()]);
        onKey(b, stopKey, [760, 300 + (i * 240)], [b.strudel('stopTrack', {TRACK: ['text', track]})]);
    });
    onKey(b, '0', [760, 1500], [b.strudel('stopAll')]);

    // jump on the kick, change color on every beat
    const kickHat = b.strudel('whenSound', {}, {DRUM: 'bd'});
    b.blocks[kickHat].topLevel = true;
    b.blocks[kickHat].x = 24;
    b.blocks[kickHat].y = 1560;
    const big = b.block('looks_setsizeto');
    b.number(big, 'SIZE', 125);
    const wait = b.block('control_wait');
    b.blocks[wait].inputs.DURATION = [1, b.shadow(wait, 'math_positive_number', 'NUM', 0.1)];
    const normal = b.block('looks_setsizeto');
    b.number(normal, 'SIZE', 100);
    b.stack([kickHat, big, wait, normal]);
    const beatHat = b.strudel('whenBeat');
    b.blocks[beatHat].topLevel = true;
    b.blocks[beatHat].x = 24;
    b.blocks[beatHat].y = 1740;
    const color = b.block('looks_changeeffectby', {fields: {EFFECT: ['COLOR', null]}});
    b.number(color, 'CHANGE', 25);
    b.stack([beatHat, color]);

    await writeProject(b, out('trance'), 'xcx-strudel make-samples');
};

// ---- acid and trance gate: one song with the acid and trance gate blocks (master level) ----
const makeAcidGate = async () => {
    const b = new Blocks();
    const $ = strudelBlocks(b);

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const level = b.strudel('setLevel', {}, {LEVEL: '3'});
    const tempo = b.strudel('setBpm', {BPM: ['number', 138]});
    const kick = $.track('キック', [$.s('bd*4'), $.bank('RolandTR909')]);
    const hats = $.track('ハイハット', [$.s('[~ hh]*4, [~ cp]*2'), $.bank('RolandTR909')]);
    const acid = $.track('アシッド', [$.note('<a1*16 a1*16 f1*16 g1*16>'), $.acidenv(0.6)]);
    const pad = $.track('パッド', [
        $.note('<[a3,c4,e4] [f3,a3,c4] [c4,e4,g4] [g3,b3,d4]>'), $.s('supersaw'),
        $.trancegate(0.8, 45, 1), $.effect('lpf', '1897')
    ]);
    const lead = $.track('リード', [
        $.n('<0 2 4 7 4 2 1 -1>*8'), $.scale('A', 'minor'), $.s('triangle'), $.transpose(24),
        $.effect('delay', '.4'), $.effect('delayfeedback', '.25')
    ]);
    const roll = b.strudel('showViz', {}, {VIZ: 'pianoroll'});
    b.stack([flag, level, tempo, kick, hats, acid, pad, lead, roll]);
    b.comment(flag, 'アシッドと トランスゲートの きょく。\n' +
        'Switch Angel さんの strudel-scripts の おとづくりを さんこうにした、ひこうしきの さくひんです' +
        '(ほんにんとは かんけいありません)。', 1100, 24);
    danceOnBeat(b, [24, 1200]);

    await writeProject(b, out('acidgate'), 'xcx-strudel make-samples');
};

// ---- acid with ducking: a random bass in a scale, a filter on a slider (master level) ----
const makeAcidDuck = async () => {
    const b = new Blocks();
    const $ = strudelBlocks(b);
    const filter = b.variable('フィルター', 2);
    const last = b.variable('前のフィルター', 2);
    b.sliderMonitor(filter, [5, 5], [0, 8]);

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const level = b.strudel('setLevel', {}, {LEVEL: '3'});
    const tempo = b.strudel('setBpm', {BPM: ['number', 140]});
    // the kick ducks orbits 2 and 3, where the bass and the pad play
    const kick = $.track('キック', [
        $.sMenu('sbd'), $.fast(4), $.effect('duck', '2:3'), $.effect('duckattack', '.2'), $.effect('duckdepth', '.8')
    ]);
    const pad = $.track('パッド', [
        $.noteMenu('c4'), $.slow(2), $.transpose(-24), $.s('supersaw'),
        $.effect('detune', '1'), $.effect('release', '5'), $.effect('fm', '2'), $.effect('orbit', '3')
    ]);
    const scope = b.strudel('showViz', {}, {VIZ: 'scope'});
    const hint = b.say('スライダーで ベースの フィルターを うごかそう。', 6);
    // the filter and its note are set before anything plays, so that the watcher below finds them the same
    const reset = b.setVariable(filter, 2);
    b.stack([flag, reset, b.setVariable(last, b.getVariable(filter)), level, tempo, kick, b.broadcast('ベース'), pad,
        scope, hint]);
    b.comment(flag, 'シンセキックで ほかの トラックを へこませる(ダッキング)アシッド。\n' +
        'ベースは マイナースケールの らんすうの おとを、えらびかた 46 で くりかえすよ。\n' +
        'Switch Angel さんの ライブコーディングを さんこうにした、ひこうしきの さくひんです' +
        '(ほんにんとは かんけいありません)。', 1100, 24);

    // the bass is played again with the new filter when the slider moves
    const bass = $.track('ベース', [
        $.n($.randomSteps(-7, 2, 16, 46, 1)), $.scale('C4', 'minor'), $.transpose(-12), $.s('sawtooth'),
        $.effect('lpf', '200'), $.effect('lpenv', b.getVariable(filter)), $.effect('lpq', '12'), $.effect('orbit', '2')
    ]);
    b.stack([b.whenReceive('ベース', [24, 1000]), bass]);
    b.comment(bass, 'らんすうを スケールの ばんごうに すると、\nいつも スケールの なかの おとに なるよ。', 1100, 1000);

    const watch = b.block('event_whenflagclicked', {top: [24, 1400]});
    const remember = () => b.setVariable(last, b.getVariable(filter));
    const same = b.block('operator_equals');
    b.text(same, 'OPERAND1', '');
    b.put(same, 'OPERAND1', b.getVariable(filter));
    b.text(same, 'OPERAND2', '');
    b.put(same, 'OPERAND2', b.getVariable(last));
    const changed = b.block('operator_not');
    b.blocks[changed].inputs.OPERAND = [2, same];
    b.blocks[same].parent = changed;
    const ifChanged = b.block('control_if');
    b.blocks[ifChanged].inputs.CONDITION = [2, changed];
    b.blocks[changed].parent = ifChanged;
    const then = [remember(), b.broadcast('ベース')];
    b.stack(then);
    b.blocks[ifChanged].inputs.SUBSTACK = [2, then[0]];
    b.blocks[then[0]].parent = ifChanged;
    const forever = b.block('control_forever');
    b.blocks[forever].inputs.SUBSTACK = [2, ifChanged];
    b.blocks[ifChanged].parent = forever;
    b.stack([watch, forever]);
    b.comment(watch, 'スライダーが うごいたかを しらべるよ。\n' +
        '「前のフィルター」は、まえに しらべた ときの「フィルター」の メモ。\n' +
        'メモと ちがったら、メモを なおして ベースを ならしなおすよ。', 1100, 1400);
    danceOnBeat(b, [24, 1780]);

    await writeProject(b, out('acidduck'), 'xcx-strudel make-samples');
};

// ---- soul pop: jazzy chords on the piano with a shuffle (standard level) ----

const makeSoulPop = async () => {
    const b = new Blocks();
    const $ = strudelBlocks(b);
    // notes from a list, a bar in each cycle
    const listNotes = name => $.note($.listMini(name, 'cycle'));
    const piano = b.list('ピアノのコード', SOUL.piano);
    const rhythm = b.list('ピアノのリズム', PIANO_RHYTHM);
    const bass = b.list('ベース', SOUL.bass);
    const melody = b.list('メロディ', SOUL.melody);
    const drums = b.list('ドラム', SOUL.drums);
    const tracks = [
        ['1', 'ピアノ', () => [listNotes(piano), $.struct($.listMini(rhythm, 'seq')), $.s('piano')]],
        ['2', 'ベース', () => [listNotes(bass), $.s('sawtooth'), $.effect('lpf', '350')]],
        ['3', 'ドラム', () => [$.s($.listMini(drums, 'stack')), $.bank('RolandTR808'), $.effect('gain', '.8')]],
        ['4', 'メロディ', () => [listNotes(melody), $.s('triangle'), $.effect('room', '.4'), $.effect('delay', '.2')]]
    ];

    const flag = b.block('event_whenflagclicked', {top: [24, 24]});
    const hint = b.say('1〜4 キーで パートを ひとつずつ とめて、スペースで ぜんぶ もどるよ。', 6);
    b.stack([flag, b.strudel('setBpm', {BPM: ['number', 92]}), b.strudel('showViz', {}, {VIZ: 'pianoroll'}),
        b.broadcast('えんそう'), hint]);
    b.comment(flag, 'ジャズや ソウルの 和音を つかった ピアノ ポップ。\n' +
        '| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |\n' +
        'ベースが 根音(ルート)を ひくので、ピアノは 根音を はぶいた 和音を ひいているよ。\n' +
        '1拍を 3つに わけた「シャッフル」の リズムで はねているよ。\n' +
        '和音・ベース・メロディは「変数」の リストに 1小節ずつ、\n' +
        'ピアノの リズムは 1拍ずつ、ドラムは 楽器ごとに 1行ずつ 入っているよ。', 1100, 24);
    b.stack([b.whenReceive('えんそう', [24, 280]), ...tracks.map(([, track, make]) => $.track(track, make()))]);
    b.stack([b.whenKey('space', [24, 1100]), b.broadcast('えんそう')]);
    tracks.forEach(([key, track], i) => {
        onKey(b, key, [24, 1220 + (i * 110)], [b.strudel('stopTrack', {TRACK: ['text', track]})]);
    });
    danceOnBeat(b, [24, 1800]);

    await writeProject(b, out('soulpop'), 'xcx-strudel make-samples');
};

await makeMelody();
await makeTrance();
await makeAcidGate();
await makeSoulPop();
await makeAcidDuck();
console.log('made projects/melody.sb3, projects/trance.sb3, projects/acidgate.sb3, projects/soulpop.sb3 and projects/acidduck.sb3');
