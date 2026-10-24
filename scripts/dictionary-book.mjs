/**
 * Entries of the dictionary (dictionary.html and en/dictionary.html), one for each block, in the order of the palette.
 * An entry has an example, which projects/dictionary.sb3 has and the page shows as a screenshot:
 * - `track`: blocks in the C block "play on track", written as the tests write them
 *   ([opcode, args] or [opcode, args, blocks in the C block]). test/unit/dictionary-book.test.js checks its `code`.
 * - `script`: (b, $) => block IDs of a script, for blocks which are not in a track. Its `code` is written by hand.
 * `heading` is the name of a block which has no words of its own.
 * `items` are the names in a menu of the block (effects, sounds, scales, pictures), which have no screenshot.
 */

const t = (ja, en) => ({ja, en});

/**
 * Range of the number of each effect, the same as EFFECTS of src/vm/extensions/block/blocks.js (a test checks it).
 * A number out of the range is made the nearest end of it. Null is an effect which takes letters.
 */
export const EFFECT_RANGES = {
    lpf: [20, 20000], hpf: [20, 20000], room: [0, 10], delay: [0, 1], gain: [0, 4], pan: [0, 1], crush: [1, 16],
    speed: [-4, 4], attack: [0, 4], release: [0, 8], clip: [0, 4], decay: [0, 4], sustain: [0, 1], delaytime: [0, 2],
    delayfeedback: [0, 0.95], lpq: [0, 30], lpenv: [-16, 16], lpd: [0, 2], lps: [0, 1], unison: [1, 8], detune: [0, 2],
    spread: [0, 1], distort: [0, 10], fm: [0, 8], vowel: null, orbit: [1, 8], duck: null, duckattack: [0.002, 2],
    duckdepth: [0, 1]
};

/** Name of the track of the examples. */
export const EXAMPLE_TRACK = 'れい';

const s = code => ['s', {CODE: code}];
const note = code => ['note', {CODE: code}];
const piano = s('piano');

export const SECTIONS = [
    {
        id: 'setup',
        title: t('はじめに', 'Getting started'),
        entries: [
            {
                id: 'setLevel',
                opcode: 'setLevel',
                level: 1,
                what: t('パレットに 出す ブロックを、<b>レベル</b>で えらぶ。ビギナーは 少しだけ、ノーマルで ミニ記法や 効果、マスターで ぜんぶの ブロックが 出るよ。',
                    'Chooses which blocks are in the palette by <b>level</b>. Beginner shows a few, Normal adds mini-notation and effects, and Master shows all the blocks.'),
                script: b => [b.block('event_whenflagclicked'), b.strudel('setLevel', {}, {LEVEL: '2'})],
                result: t('緑の旗を おすと、パレットに ノーマルの ブロックが ふえる。', 'Click the green flag, and the Normal blocks appear in the palette.'),
                uses: t(['作品の さいしょに 置いて、その 作品に いる ブロックが 出る ように する'],
                    ['Put it at the start of a project so that the blocks it needs are in the palette']),
                code: null,
                history: t('Strudel には ない、この 拡張だけの ブロック。たくさんの ブロックに まよわない ように、少しずつ ふやせる ように したよ。',
                    'Strudel does not have it: it is a block of this extension, so that you can add blocks little by little and not get lost.')
            }
        ]
    },
    {
        id: 'tracks',
        title: t('トラックと テンポ', 'Tracks and tempo'),
        entries: [
            {
                id: 'track',
                opcode: 'track',
                level: 1,
                what: t('中に 積んだ ブロックで パターンを 作って、<b>名前の ついた トラック</b>で 鳴らしつづける。同じ 名前で もう一度 鳴らすと、つぎの サイクルから 入れかわる。名前を かえると、べつの トラックとして 重なるよ。',
                    'Makes a pattern from the blocks in it and keeps playing it on a <b>named track</b>. Play the same name again, and it changes at the next cycle. Use another name, and the tracks play together.'),
                track: [['sMenu', {SOUND: 'bd'}], ['fast', {TIMES: 4}]],
                code: 's("bd").fast(4)',
                result: t('ドン ドン ドン ドン と キックが 鳴りつづける。', 'The kick keeps playing: boom boom boom boom.'),
                uses: t(['ドラム・ベース・メロディを トラックに 分けて、1つずつ 止めたり かえたり する',
                    'キーを おしたら 同じ トラックを べつの パターンで 鳴らして、曲を 切りかえる'],
                ['Put drums, bass and melody on separate tracks, to stop or change them one by one',
                    'Play the same track with another pattern when a key is pressed, to switch the music']),
                history: t('中の ブロックは 上から じゅんばんに、Strudel の <code>.fast(4)</code> のような 1だんずつに なる。トラック 1本が Strudel の <code>$:</code> の 1行に あたるよ。',
                    'The blocks in it are read from the top, and each becomes one step of Strudel, such as <code>.fast(4)</code>. One track is one <code>$:</code> line of Strudel.')
            },
            {
                id: 'stopTrack',
                opcode: 'stopTrack',
                level: 1,
                what: t('名前の トラックを <b>止める</b>。ほかの トラックは 鳴りつづけるよ。', '<b>Stops</b> the named track. The other tracks keep playing.'),
                script: b => [b.whenKey('space'), b.strudel('stopTrack', {TRACK: ['text', 'ドラム']})],
                result: t('スペースキーを おすと、「ドラム」トラックだけ 止まる。', 'Press space, and only the track "drums" stops.'),
                uses: t(['ドラムを 止めて「ブレイク」を つくる(<a href="rhythms.html#break">リズム図鑑</a>)'],
                    ['Stop the drums for a break (<a href="rhythms.html#break">rhythm book</a>)']),
                code: '$: s("bd*4").hush()',
                history: t('Strudel では、その 行を 消すか、行の さいごに <code>.hush()</code>(だまらせる)を つける。',
                    'In Strudel, delete the line, or add <code>.hush()</code> (be quiet) at its end.')
            },
            {
                id: 'stopAll',
                opcode: 'stopAll',
                level: 1,
                what: t('<b>ぜんぶの トラック</b>を 止めて、わすれる。赤い ボタン(止める)は 音を 止める だけで、トラックの 中身は おぼえている(「全部のトラックのStrudelコード」に のこる)。このブロックは 中身も 消すよ。',
                    'Stops and forgets <b>all the tracks</b>. The red stop button only stops the sound and keeps the tracks (they stay in "Strudel code of all tracks"); this block forgets them too.'),
                script: b => [b.whenKey('0'), b.strudel('stopAll')],
                result: t('0 キーを おすと、音が ぜんぶ 止まる。', 'Press 0, and all the sound stops.'),
                uses: t(['曲の おわりや、やりなおす ときに つかう'], ['Use it at the end of a song, or to start again']),
                code: 'hush()',
                history: t('<b>hush</b> は 英語で「しーっ、静かに」。strudel.cc では Ctrl + . でも 止まるよ。',
                    '<b>Hush</b> means "shh, be quiet". In strudel.cc, Ctrl + . stops the sound too.')
            },
            {
                id: 'setBpm',
                opcode: 'setBpm',
                level: 1,
                what: t('<b>テンポ</b>(1分間に 何拍か)を きめる。ふつうは 120 くらい。ヒップホップは 90 くらい、ドラムンベースは 170 くらい だよ。',
                    'Sets the <b>tempo</b> (beats in a minute). Usually about 120: hip hop is about 90, drum and bass about 170.'),
                script: b => [b.block('event_whenflagclicked'), b.strudel('setBpm', {BPM: ['number', 90]})],
                result: t('緑の旗を おすと、テンポが 90 に なって、ゆっくりに なる。', 'Click the green flag, and the tempo becomes 90: slower.'),
                uses: t(['ジャンルに あわせて テンポを えらぶ(<a href="rhythms.html">リズム図鑑</a>に ジャンルごとの BPM が あるよ)'],
                    ['Choose a tempo for the genre (the <a href="rhythms.html">rhythm book</a> has the BPM of each genre)']),
                code: 'setcpm(90/4)',
                history: t('<b>BPM</b> = <b>b</b>eats <b>p</b>er <b>m</b>inute(1分間の 拍の 数)。Strudel は サイクルで 数えるので、1サイクルが 4拍なら <code>setcpm(90/4)</code>(1分間に 22.5 サイクル)と 書くよ。',
                    '<b>BPM</b> = <b>b</b>eats <b>p</b>er <b>m</b>inute. Strudel counts cycles, so with 4 beats in a cycle it writes <code>setcpm(90/4)</code> (22.5 cycles a minute).')
            },
            {
                id: 'setBeatsPerCycle',
                opcode: 'setBeatsPerCycle',
                level: 2,
                what: t('1サイクルを <b>何拍</b>に するかを きめる。ふつうは 4拍。3 に すると ワルツの ような 3拍子に なるよ。',
                    'Sets how many <b>beats</b> a cycle has. Usually 4. Set 3 for three beats, like a waltz.'),
                script: (b, $) => [b.block('event_whenflagclicked'), b.strudel('setBeatsPerCycle', {BEATS: ['number', 3]}),
                    $.track(EXAMPLE_TRACK, [$.s('bd sd sd')])],
                result: t('ズン チャッ チャッ の 3拍子に なる。', 'It plays in three: boom chick chick.'),
                uses: t(['ワルツや 6/8拍子の 曲を つくる', '「拍がきたとき」で 動く 回数を かえる'],
                    ['Make a waltz or a song in 6/8', 'Change how often "when a beat comes" runs']),
                code: 'setcpm(120/3)\n$: s("bd sd sd")',
                history: t('テンポ(BPM)は かえずに、1サイクルの 長さが かわる。「拍がきたとき」と「拍」も この 数に あわせて 動くよ。',
                    'The tempo (BPM) stays, and the length of a cycle changes. "When a beat comes" and "beat" follow this number.')
            }
        ]
    },
    {
        id: 'sounds',
        title: t('音を えらぶ', 'Choosing sounds'),
        entries: [
            {
                id: 's',
                opcode: 's',
                label: 'sMenu',
                level: 1,
                what: t('鳴らす <b>音の 種類</b>を きめる。ビギナーでは ▼ で えらび、ノーマルからは 文字で ミニ記法を 書ける。トラックの 一番上なら 音を きめ、下に 置くと 音色を かえるよ(<code>.s()</code>)。',
                    'Chooses the <b>kind of sound</b>. In Beginner you choose it with ▼; from Normal you can write mini-notation. At the top of a track it sets the sound; below, it changes the sound (<code>.s()</code>).'),
                track: [s('bd hh sd hh')],
                code: 's("bd hh sd hh")',
                result: t('ドン チッ タン チッ と 鳴る。', 'It plays boom tick clap tick.'),
                uses: t(['ドラムの リズムを 書く(<a href="rhythms.html">リズム図鑑</a>)', '「音の高さ」の 下に 置いて、ピアノや シンセの 音に する'],
                    ['Write a drum rhythm (<a href="rhythms.html">rhythm book</a>)', 'Put it below note to play the notes with a piano or a synth']),
                history: t('<b>sound</b>(音)の 略。TidalCycles の 音源 SuperDirt で つかわれていた 名前を そのまま 受けついでいる。',
                    'Short for <b>sound</b>. The name comes straight from SuperDirt, the sound engine of TidalCycles.'),
                items: [
                    {
                        id: 'drums',
                        name: 'bd sd hh oh cp rim lt mt ht cr',
                        what: t('ドラムの 音の 名前。bd = バスドラム、sd = スネア、hh = ハイハット、oh = オープンハイハット、cp = クラップ(手拍子)、rim = リム、lt / mt / ht = 低い / 中くらい / 高い タム、cr = クラッシュシンバル。',
                            'Names of drum sounds. bd = bass drum, sd = snare, hh = hi-hat, oh = open hi-hat, cp = clap (hand clap), rim = rim, lt / mt / ht = low / middle / high tom, cr = crash cymbal.'),
                        code: 's("bd hh sd hh")',
                        history: t('ドラムマシンの つまみに 書かれていた 略語が もとで、TidalCycles の 音の フォルダ名として 広まった。<b>bd</b> = <b>b</b>ass <b>d</b>rum、<b>sd</b> = <b>s</b>nare <b>d</b>rum、<b>hh</b> = <b>h</b>i-<b>h</b>at。',
                            'These short names come from the labels on drum machine knobs. They became popular as sound folder names in TidalCycles. <b>bd</b> = <b>b</b>ass <b>d</b>rum, <b>sd</b> = <b>s</b>nare <b>d</b>rum, <b>hh</b> = <b>h</b>i-<b>h</b>at.')
                    },
                    {
                        id: 'sbd',
                        name: 'sbd',
                        what: t('シンセサイザーで つくった キック(<b>s</b>ynth <b>b</b>ass <b>d</b>rum)。録音した 音ではなく、計算で 鳴らしているよ。',
                            'A kick made by a synthesizer (<b>s</b>ynth <b>b</b>ass <b>d</b>rum). It is not a recorded sound. It is made by calculation.'),
                        code: 's("sbd!4")',
                        history: t('音が 低い 方へ すべり 落ちる「ドゥン」という キックは、TR-808 の キックと 同じ しくみ(高さを すばやく 下げる)。',
                            'The "boom" kick that slides down in pitch works the same way as the TR-808 kick: the pitch drops very quickly.')
                    },
                    {
                        id: 'waves',
                        name: 'sine square sawtooth triangle',
                        what: t('シンセサイザーの 基本の 波の 形。sine = やわらかい、square = ピコピコ、sawtooth = ギザギザで 明るい、triangle = すっきり。',
                            'The basic wave shapes of a synthesizer. sine = soft, square = beepy, sawtooth = jagged and bright, triangle = clean.'),
                        code: 'note("c4").s("sawtooth")',
                        history: t('どれも 波の 形の 名前。sine は 数学の 正弦(サイン)波、square は 四角、sawtooth は「ノコギリの 歯」、triangle は 三角。1960年代の アナログシンセから ずっと つかわれている。',
                            'They are all names of wave shapes. sine is the sine wave from math, square is a square, sawtooth is "the teeth of a saw", and triangle is a triangle. They have been used since the analog synths of the 1960s.')
                    },
                    {
                        id: 'supersaw',
                        name: 'supersaw',
                        what: t('ノコギリ波を 何本も 少しずつ ずらして かさねた、分厚くて キラキラした 音。',
                            'A thick, sparkly sound made by stacking many sawtooth waves, each a little out of tune.'),
                        code: 'note("[a3,c4,e4]").s("supersaw")',
                        history: t('1997年ごろに 出た ローランドの シンセ <b>JP-8000</b> の 機能の 名前。7本の ノコギリ波を かさねる この 音が、トランスという 音楽の 代表的な 音に なった。',
                            'The name of a feature on the Roland <b>JP-8000</b> synth, which came out around 1997. Its sound of 7 stacked sawtooth waves became a typical sound of a kind of music called trance.')
                    },
                    {
                        id: 'white',
                        name: 'white',
                        what: t('ザーッという <b>ノイズ</b>。ビルドアップで だんだん 大きく する 音(ライザー)に つかう。',
                            'A "shhh" <b>noise</b>. Used for a riser, a sound that gets louder and louder in a build-up.'),
                        code: 's("white*16")',
                        history: t('<b>ホワイトノイズ</b>。白い 光に すべての 色が まざっている ように、すべての 高さの 音が 同じ くらい まざっているから「白」と よばれる。',
                            '<b>White noise</b>. White light has all colors mixed in. In the same way, this noise has all pitches mixed in at about the same amount, so it is called "white".')
                    }
                ]
            },
            {
                id: 'note',
                opcode: 'note',
                label: 'noteMenu',
                level: 1,
                what: t('音の <b>高さ</b>を 音名(<code>c4</code>)や 数字(60 = c4)で 書く。下に「音」を 置くと、その 音色で 鳴るよ。',
                    'Writes the <b>pitch</b> with a note name (<code>c4</code>) or a number (60 = c4). Put s below it to play it with that sound.'),
                track: [note('c4 e4 g4'), piano],
                code: 'note("c4 e4 g4").s("piano")',
                result: t('ピアノで ド ミ ソ と 鳴る。', 'The piano plays C, E, G.'),
                uses: t(['メロディや ベースを 書く', '<code>[c4,e4,g4]</code> と カンマで 書いて、和音を 鳴らす'],
                    ['Write a melody or a bass line', 'Write <code>[c4,e4,g4]</code> with commas to play a chord']),
                history: t('英語で「音符」。数字は MIDI(1983年に きまった 電子楽器の 共通ルール)の 番号で、60 が まんなかの ド。',
                    '"Note" means a musical note. The numbers are MIDI numbers (MIDI is a shared set of rules for electronic instruments, made in 1983). 60 is middle C.')
            },
            {
                id: 'n',
                opcode: 'n',
                level: 2,
                what: t('音階の 中の <b>何番目の 音</b>かを 番号で 書く。下に「音階」を 置くと、番号が その 音階の 音に なる。0 が 1番目。番号で 書くと、どんな 音階でも 音を はずさないよ。',
                    'Writes <b>which note of a scale</b> to play, by number. Put scale below it to turn the numbers into notes of that scale. 0 is the first. With numbers you never play a wrong note.'),
                track: [['n', {CODE: '0 2 4 7'}], ['scale', {ROOT: 'C4', SCALE: 'major'}], piano],
                code: 'n("0 2 4 7").scale("C4:major").s("piano")',
                result: t('ド ミ ソ ド(上の)と 鳴る。', 'It plays C, E, G and the high C.'),
                uses: t(['メロディを 音階から はずれない ように 書く', '「音階」だけ かえて、同じ メロディを 明るく したり 暗く したり する'],
                    ['Write a melody which stays in the scale', 'Change only the scale to make the same melody bright or dark']),
                history: t('<b>n</b> は <b>number</b>(番号)。', '<b>n</b> means <b>number</b>.')
            },
            {
                id: 'seq',
                opcode: 'seq',
                level: 1,
                what: t('音を 1サイクルの 中に <b>順番に</b> ならべる。4つ ならべると、1つが 1/4 サイクルずつ 鳴るよ。',
                    'Puts sounds <b>in order</b> inside one cycle. With 4 sounds, each one plays for 1/4 of a cycle.'),
                track: [['seq', {A: 'bd', B: 'hh', C: 'sd', D: 'hh'}]],
                code: 'seq(s("bd"), s("hh"), s("sd"), s("hh"))',
                result: t('ドン チッ タン チッ と 鳴る。', 'It plays boom tick clap tick.'),
                uses: t(['ビギナーで リズムを 組む。▼ で <code>~</code>(休み)を えらぶと、音を 鳴らさない マスが 作れる'],
                    ['Build a rhythm in Beginner. Choose <code>~</code> (rest) in ▼ for a step with no sound']),
                history: t('<b>sequence</b>(シーケンス、ならび)の 略。音を 順番に 鳴らす 機械「シーケンサー」と 同じ ことばだよ。ミニ記法では 空白で 区切って ならべる(<code>"bd hh sd hh"</code>)。',
                    'Short for <b>sequence</b> (a line of things in order). It is the same word as "sequencer", a machine that plays sounds in order. In mini-notation, put them in a row with spaces (<code>"bd hh sd hh"</code>).')
            },
            {
                id: 'stack',
                opcode: 'stack',
                level: 1,
                what: t('音を <b>同時に</b> かさねて 鳴らす。', 'Plays sounds <b>at the same time</b>, stacked up.'),
                track: [['stack', {A: 'bd', B: 'hh'}], ['fast', {TIMES: 4}]],
                code: 'stack(s("bd"), s("hh")).fast(4)',
                result: t('キックと ハイハットが いっしょに 4回 鳴る。', 'The kick and the hi-hat play together, 4 times.'),
                uses: t(['ビギナーで 2つの 音を いっしょに 鳴らす。もっと 重ねるなら、C型の「重ねる」か、トラックを 分ける'],
                    ['Play two sounds together in Beginner. To stack more, use the C block stack or separate tracks']),
                history: t('英語で「つみかさねる」。ミニ記法では <code>,</code>(カンマ)で 同じ ことが できるよ(<code>"bd, hh"</code>)。',
                    'It means "to pile up" in English. In mini-notation, a <code>,</code> (comma) does the same thing (<code>"bd, hh"</code>).')
            },
            {
                id: 'stackBranch',
                opcode: 'stackBranch',
                heading: t('重ねる(C型)', 'stack (C block)'),
                level: 2,
                what: t('C型の 中に 積んだ ブロックを <b>べつの 鎖</b>として、上の 音と 同時に 鳴らす。中の ブロックは 中の 音だけに かかり、下に 積んだ ブロックは ぜんぶの 音に かかるよ。',
                    'Plays the blocks in it as <b>another chain</b>, at the same time as the sound above. Blocks in it change only the sound in it; blocks below it change all the sounds.'),
                track: [s('bd*4'), ['stackBranch', {}, [s('[~ sd]*2')]], ['bank', {MACHINE: 'RolandTR909'}]],
                code: 'stack(s("bd*4"), s("[~ sd]*2")).bank("RolandTR909")',
                result: t('キックと スネアが いっしょに、TR-909 の 音で 鳴る。', 'The kick and the snare play together, with the sounds of the TR-909.'),
                uses: t(['ドラムの 楽器ごとに 欄を 分けて、短く 読みやすく 書く(<a href="rhythms.html">リズム図鑑</a>)'],
                    ['Write each drum in its own short input, easy to read (<a href="rhythms.html">rhythm book</a>)']),
                history: t('Strudel の <code>stack( , )</code> の カンマ 1つ分が、このブロック 1つ分。トラックを 分けると 1本ずつ 止められ、stack で 重ねると まとめて 止まるよ。',
                    'One of these blocks is one part between the commas of <code>stack( , )</code> in Strudel. Separate tracks can be stopped one by one; stacked sounds stop together.')
            },
            {
                id: 'cat',
                opcode: 'cat',
                level: 1,
                what: t('1サイクルごとに <b>交互に</b> 鳴らす。1回目は c4、2回目は g4、3回目は また c4…。',
                    'Plays them <b>by turns</b>, one per cycle. First c4, then g4, then c4 again...'),
                track: [['cat', {A: 'c4', B: 'g4'}], ['fast', {TIMES: 4}]],
                code: 'cat(note("c4"), note("g4")).fast(4)',
                result: t('ド ソ ド ソ と 交互に 鳴る。', 'It plays C, G, C, G by turns.'),
                uses: t(['サイクルごとに ベースの 音を かえる'], ['Change the bass note every cycle']),
                history: t('<b>concatenate</b>(つなげる)の 略。プログラミングでは 文字を つなげる ときに よく つかう 名前だよ。ミニ記法の <code>&lt; &gt;</code> と 同じ。',
                    'Short for <b>concatenate</b> (to join together). In programming, this name is often used for joining text. It is the same as <code>&lt; &gt;</code> in mini-notation.')
            },
            {
                id: 'spriteSound',
                opcode: 'spriteSound',
                level: 2,
                what: t('スプライトの「音」タブに ある 音(録音した 声など)を、ドラムの ように 鳴らす。',
                    'Plays a sound in the Sounds tab of the sprite (such as your recorded voice), like a drum.'),
                script: (b, $) => [$.track(EXAMPLE_TRACK, [$.spriteSound('Meow'), $.fast(2)])],
                result: t('ねこの「ニャー」が 2回 鳴る。', 'The cat says meow twice.'),
                uses: t(['じぶんの 声で ビートを つくる(<a href="tutorial.html#step10">チュートリアル 10章</a>)'],
                    ['Make a beat with your own voice (<a href="tutorial.html#step10">tutorial step 10</a>)']),
                code: null,
                history: t('Strudel では <code>samples()</code> で 音の ファイルを 読みこんで 鳴らす。スプライトの 音は strudel.cc からは 読めないので、書き出した コードでは 鳴らないよ。',
                    'Strudel loads sound files with <code>samples()</code>. strudel.cc cannot read the sounds of a sprite, so they do not play in the exported code.')
            },
            {
                id: 'chord',
                opcode: 'chord',
                level: 3,
                what: t('根音(ルート)と 種類を えらんで、<b>和音</b>を 鳴らす。major は 明るい、minor は 暗い、7 や maj7 は おしゃれな ひびき。',
                    'Plays a <b>chord</b> from a root and a kind. major is bright, minor is dark, 7 and maj7 sound jazzy.'),
                track: [['chord', {ROOT: 'C4', CHORD: 'major7'}], piano],
                code: 'note("[c4,e4,g4,b4]").s("piano")',
                result: t('ド ミ ソ シ が いっしょに 鳴る。', 'C, E, G and B play together.'),
                uses: t(['下に「アルペジオ」を 置いて 1音ずつ 鳴らす', '「リズムで鳴らす」で 和音を きざむ'],
                    ['Put arp below it to play the notes one by one', 'Chop the chord with struct']),
                history: t('英語で「和音」。もとは accord(一致、調和)と 同じ ことばだよ。',
                    '"Chord" comes from the same word as accord (agreement, harmony).')
            }
        ]
    },
    {
        id: 'change',
        title: t('音を かえる', 'Changing the sound'),
        lead: t('ここからの ブロックは、トラックの 中で 音の ブロックの <b>下に</b> 積む。上から じゅんばんに かかるよ。',
            'The blocks from here go <b>below</b> a sound block in a track. They work from the top down.'),
        entries: [
            {
                id: 'fast',
                opcode: 'fast',
                level: 1,
                what: t('パターンを <b>N倍の 速さ</b>に する。1つの 音なら、1サイクルに N回 鳴る。', 'Makes the pattern <b>N times faster</b>. A single sound plays N times in one cycle.'),
                track: [s('hh'), ['fast', {TIMES: 8}]],
                code: 's("hh").fast(8)',
                result: t('ハイハットが 1サイクルに 8回、チッチッチッチッ…と きざむ。', 'The hi-hat ticks 8 times in a cycle.'),
                uses: t(['ハイハットを きざむ(8 で 8分音符、16 で 16分音符)', 'メロディを 2倍の 速さで くりかえす'],
                    ['Make the hi-hat tick (8 for eighth notes, 16 for sixteenth notes)', 'Play a melody twice as fast']),
                history: t('TidalCycles から ある 基本の 名前。ミニ記法の <code>*</code> と 同じ(<code>"hh*8"</code>)。',
                    'A basic name from TidalCycles. It is the same as <code>*</code> in mini-notation (<code>"hh*8"</code>).')
            },
            {
                id: 'slow',
                opcode: 'slow',
                level: 2,
                what: t('パターンを <b>N倍 ゆっくり</b> に して、Nサイクルに のばす。', 'Makes the pattern <b>N times slower</b>, stretching it over N cycles.'),
                track: [note('c4 e4 g4 b4'), ['slow', {CYCLES: 2}], piano],
                code: 'note("c4 e4 g4 b4").slow(2).s("piano")',
                result: t('4つの 音が 2サイクル かけて、ゆっくり 鳴る。', 'The four notes play slowly, over two cycles.'),
                uses: t(['長く のばす パッドや 和音を ゆっくり かえる'], ['Change long pads and chords slowly']),
                history: t('<code>fast</code> の 反対。ミニ記法の <code>/</code> と 同じ(<code>"c4/2"</code>)。',
                    'The opposite of <code>fast</code>. It is the same as <code>/</code> in mini-notation (<code>"c4/2"</code>).')
            },
            {
                id: 'scale',
                opcode: 'scale',
                level: 2,
                what: t('「音階の番号」の 番号を、えらんだ <b>音階</b>の 音に かえる。根音(C4 など)と 音階の 種類を えらぶよ。',
                    'Turns the numbers of n into notes of the chosen <b>scale</b>. Choose the root (such as C4) and the kind of scale.'),
                track: [['n', {CODE: '0 1 2 3 4'}], ['scale', {ROOT: 'C4', SCALE: 'minor'}], piano],
                code: 'n("0 1 2 3 4").scale("C4:minor").s("piano")',
                result: t('ド レ ミ♭ ファ ソ と、暗い ひびきで 上がる。', 'It goes up C, D, E♭, F, G: a dark sound.'),
                uses: t(['同じ 番号の まま 音階を かえて、曲の 気分を かえる'], ['Keep the numbers and change the scale to change the mood']),
                history: t('英語で「音階」。もとは ラテン語の scala =「はしご」。音が はしごの 段の ように ならぶから。',
                    'It comes from the Latin word scala, which means "ladder", because the notes line up like the steps of a ladder.'),
                items: [
                    {
                        id: 'major',
                        name: 'major minor',
                        what: t('major は 明るい 音階(長調)、minor は 暗い 音階(短調)。', 'major is a bright scale (major key), minor is a dark scale (minor key).'),
                        code: 'n("0 2 4").scale("C4:minor")',
                        history: t('英語で major =「大きい」、minor =「小さい」。ドと ミの 間(3度)が 大きいか 小さいかで 名前が ついた。',
                            'In English, major = "bigger", minor = "smaller". They are named by whether the gap between C and E (a third) is big or small.')
                    },
                    {
                        id: 'pentatonic',
                        name: 'major:pentatonic minor:pentatonic',
                        what: t('5つの 音だけの 音階。どう ならべても きれいに 聞こえる。', 'A scale with only 5 notes. It sounds nice in any order.'),
                        code: 'n("0 1 2 3 4").scale("C4:major:pentatonic")',
                        history: t('ギリシャ語の penta(5)+ tonic(音)。日本の「ヨナ抜き音階」も その 仲間(4番目と 7番目を ぬく)。',
                            'From the Greek penta (5) + tonic (tone). The Japanese "yonanuki" scale, which leaves out the 4th and 7th notes, is in the same family.')
                    },
                    {
                        id: 'blues',
                        name: 'blues dorian chromatic',
                        what: t('blues は ブルースの 音階、dorian は ジャズや ケルト音楽で 好まれる 音階、chromatic は 半音を ぜんぶ ならべた 音階。',
                            'blues is the scale of blues music, dorian is a scale loved in jazz and Celtic music, and chromatic is a scale with every half step.'),
                        code: 'n("0 1 2 3").scale("C4:dorian")',
                        history: t('<b>dorian</b> は 古代ギリシャの ドーリア人から 名前を とった 音階で、中世の 教会音楽を へて 今に つたわる。<b>chromatic</b> は ギリシャ語の chroma(色)から。',
                            '<b>dorian</b> is a scale named after the Dorians of ancient Greece. It came down to us through the church music of the Middle Ages. <b>chromatic</b> comes from the Greek chroma (color).')
                    }
                ]
            },
            {
                id: 'struct',
                opcode: 'struct',
                level: 2,
                what: t('<code>x</code> と <code>~</code> で 書いた リズムで、音を <b>きざむ</b>。<code>x</code> で 鳴らし、<code>~</code> で 休む。', '<b>Chops</b> the sound into the rhythm you write with <code>x</code> (play) and <code>~</code> (rest).'),
                track: [note('[c3,e3,g3]'), ['struct', {RHYTHM: 'x ~ x x'}], piano],
                code: 'note("[c3,e3,g3]").struct("x ~ x x").s("piano")',
                result: t('和音が ジャン・・ジャン ジャン と リズムに のる。', 'The chord plays on the rhythm: hit, rest, hit, hit.'),
                uses: t(['和音を リズムに のせて、ピアノや ギターの ような 伴奏に する'], ['Put a chord on a rhythm, like a piano or guitar part']),
                history: t('<b>structure</b>(つくり、骨組み)の 略。リズムの「骨組み」だけを ほかの パターンから かりてくる、という 意味だよ。',
                    'Short for <b>structure</b> (the frame or skeleton). It means you borrow just the "skeleton" of a rhythm.')
            },
            {
                id: 'beat',
                opcode: 'beat',
                level: 2,
                what: t('1サイクルを <b>Nこの マス</b>に 分けて、番号の マスで 鳴らす。0 が 1番目の マス。<code>,</code> で 番号を ならべ、<code>7?</code> の ように <code>?</code> を つけると その マスは ときどき 鳴らない。',
                    'Cuts a cycle into <b>N steps</b> and plays on the numbered steps. 0 is the first step. List the numbers with <code>,</code>, and add <code>?</code> like <code>7?</code> to drop that step sometimes.'),
                track: [s('bd'), ['beat', {BEATS: '0,7,10', STEPS: 16}]],
                code: 's("bd").beat("0,7,10", 16)',
                result: t('キックが 拍から ずれた 場所で 鳴って、はずむ。', 'The kick plays off the beats and bounces.'),
                uses: t(['ばらばらの 場所で 鳴る キックや スネアを 書く(<a href="rhythms.html">リズム図鑑</a>)'],
                    ['Write kicks and snares which play here and there (<a href="rhythms.html">rhythm book</a>)']),
                history: t('英語で「拍」。16マスに 音を おいていく やりかたは、TR-808 などの ドラムマシンが 16この ボタンで リズムを 組んだ のと 同じ 考えかただよ。',
                    'English for the pulse of music. Putting sounds on 16 steps is how drum machines such as the TR-808 build rhythms with their 16 step buttons.')
            },
            {
                id: 'bank',
                opcode: 'bank',
                level: 2,
                what: t('ドラムの 音を、えらんだ <b>ドラムマシン</b>の 音に かえる。', 'Changes the drums to the sounds of the chosen <b>drum machine</b>.'),
                track: [s('bd*4'), ['bank', {MACHINE: 'RolandTR909'}]],
                code: 's("bd*4").bank("RolandTR909")',
                result: t('キックが TR-909 の かたい 音に なる。', 'The kick becomes the hard sound of the TR-909.'),
                uses: t(['ハウスや テクノは TR-909、ヒップホップや トラップは TR-808 に する'], ['Use the TR-909 for house and techno, the TR-808 for hip hop and trap']),
                history: t('<b>sample bank</b>(サンプルの 倉庫)から。<b>TR-808</b>(1980年)と <b>TR-909</b>(1983年)は ローランドの ドラムマシンで、ヒップホップや ハウス、テクノの 音を つくった 名機だよ。',
                    'From <b>sample bank</b> (a storehouse of samples). The <b>TR-808</b> (1980) and <b>TR-909</b> (1983) are Roland drum machines. These famous machines made the sound of hip-hop, house and techno.')
            },
            {
                id: 'effect',
                opcode: 'effect',
                heading: t('効果 [ ▼] [ ]', 'effect [ ▼] [ ]'),
                level: 2,
                what: t('▼で えらんだ <b>効果</b>(エフェクト)を かける。数字の 欄には、ミニ記法の パターンや「ゆれる値」も 入れられるよ。数字は 効果ごとに きまった <b>範囲</b>の 中に おさめられる(範囲より 大きい 数は いちばん 大きい 数に なる)。範囲と 目安は 下の 表を 見てね。',
                    'Adds the <b>effect</b> chosen in ▼. The number can also be a mini-notation pattern or a wave. Each effect keeps its number in a <b>range</b>: a bigger number becomes the biggest of the range. See the table below for the ranges and good values.'),
                track: [note('c2*4'), s('sawtooth'), ['effect', {EFFECT: 'lpf', VALUE: '600'}]],
                code: 'note("c2*4").s("sawtooth").lpf(600)',
                result: t('ギザギザの ベースの 高い 音が けずれて、こもった 太い 音に なる。', 'The high part of the jagged bass is cut, and it becomes a muffled, fat sound.'),
                uses: t(['ベースを こもらせる、ドラムに ひびきを つける、ハイハットの 音量を 小さく する',
                    '1つの 音に 効果を いくつも 重ねる(上から じゅんばんに かかる)'],
                ['Muffle a bass, add room to the drums, make the hi-hat softer', 'Stack many effects on a sound (they work from the top)']),
                history: t('▼ の 名前は 日本語や カタカナ だけど、1つ 1つが Strudel の 関数に なる。下の 一覧で どの 関数かを しらべよう。',
                    'Each name in ▼ is a Strudel function. Look them up in the list below.'),
                items: [
                    {
                        id: 'lpf',
                        hint: t('200 で こもった 音、1000 で 少し こもる、5000 以上で ほぼ そのまま。hpf は 大きいほど 低い 音が 消える', '200 is muffled, 1000 a little muffled, 5000 or more almost unchanged. With hpf, bigger numbers take away more of the low sound'),
                        name: 'lpf hpf',
                        what: t('<b>lpf</b> は 高い 音を けずって こもらせる。<b>hpf</b> は 低い 音を けずって シャカシャカに する。数字は どこから けずるか(Hz)。',
                            '<b>lpf</b> cuts the high sounds and makes it muffled. <b>hpf</b> cuts the low sounds and makes it thin and tinny. The number is where the cutting starts (Hz).'),
                        code: 's("sawtooth").lpf(600)',
                        history: t('<b>l</b>ow-<b>p</b>ass <b>f</b>ilter(低い 音を 通す フィルター)、<b>h</b>igh-<b>p</b>ass <b>f</b>ilter。1960年代に ロバート・モーグさんが つくった シンセの フィルターが 有名。',
                            '<b>L</b>ow-<b>p</b>ass <b>f</b>ilter (a filter that lets low sounds pass) and <b>h</b>igh-<b>p</b>ass <b>f</b>ilter. The filters in the synths that Robert Moog made in the 1960s are famous.')
                    },
                    {
                        id: 'lpq',
                        hint: t('0 で くせなし。10〜20 で「ミョーン」', '0 has no character; 10-20 goes "wowww"'),
                        name: 'lpq',
                        what: t('フィルターの 境目を 強調して、「ミョーン」と <b>くせの ある 音</b>に する(レゾナンス)。',
                            'Boosts the edge of the filter for a "wowww" sound <b>with a strong character</b> (resonance).'),
                        code: 's("sawtooth").lpf(400).lpq(12)',
                        history: t('<b>q</b> は 電気の ことばで「Q値(きれの するどさ)」。',
                            '<b>q</b> is an electronics word: the "Q value" (how sharp the cut is).')
                    },
                    {
                        id: 'lpenv',
                        hint: t('0 で 動かない。4〜8 で よく 動く。lpd・lps は 0〜1 くらい', '0 does not move; 4-8 moves a lot. lpd and lps are about 0-1'),
                        name: 'lpenv lpd lps',
                        what: t('音が 鳴るたびに フィルターを <b>開いて 閉じる</b>。lpd は 閉じるまでの 時間、lps は 残る 量。アシッドの「ビヨッ」は これ。',
                            '<b>Opens and closes</b> the filter each time a sound plays. lpd is the time until it closes, lps is how much stays open. The "bwow" of acid music is this.'),
                        code: 'note("a1*8").s("sawtooth").lpf(200).lpenv(4)',
                        history: t('<b>env</b> = <b>env</b>elope(エンベロープ、音の 形の 変化)。<b>d</b> = decay、<b>s</b> = sustain(下の ADSR を 見てね)。',
                            '<b>env</b> = <b>env</b>elope (how the shape of a sound changes). <b>d</b> = decay, <b>s</b> = sustain (see ADSR below).')
                    },
                    {
                        id: 'adsr',
                        hint: t('秒で 書く。attack 0 で すぐ 鳴る、release 1〜2 で 長い 余韻。sustain は 0〜1', 'In seconds. attack 0 starts at once, release 1-2 fades out long. sustain is 0-1'),
                        name: 'attack decay sustain release',
                        what: t('音量の <b>形</b>。attack = 鳴りはじめの ゆっくりさ、decay = 下がる 時間、sustain = 残る 大きさ、release = 鳴りおわりの 余韻。',
                            'The <b>shape</b> of the volume. attack = how slowly it starts, decay = time to go down, sustain = how loud it stays, release = how it fades out at the end.'),
                        code: 'note("c4").s("sine").attack(.5).release(2)',
                        history: t('4つの 頭文字で「<b>ADSR</b>」。1960年代に、電子音楽の 研究者 ウラジミール・ウサチェフスキーさんが 考えたと いわれ、今の ほとんどの シンセに ある。',
                            'The 4 first letters make "<b>ADSR</b>". It is said that Vladimir Ussachevsky, an electronic music researcher, came up with it in the 1960s. Almost every synth today has it.')
                    },
                    {
                        id: 'room',
                        hint: t('0 で なし、0.3 で 少し、1 で 大きな 部屋', '0 is none, 0.3 a little, 1 a big room'),
                        name: 'room',
                        what: t('<b>ひびき</b>(リバーブ)。広い 部屋で 鳴らした ように なる。',
                            '<b>Echoing space</b> (reverb). It sounds like playing in a big room.'),
                        code: 's("sd").room(.5)',
                        history: t('英語で「部屋」。部屋の 大きさで ひびきかたが かわる ことから。',
                            '"Room" in English. The sound echoes differently depending on the size of the room.')
                    },
                    {
                        id: 'delay',
                        hint: t('delay は 0〜1 の 大きさ。delaytime は 秒(0.25 で 1/4 秒)。delayfeedback 0.5 で 何回か くりかえす', 'delay is the amount, 0-1. delaytime is in seconds (0.25 is a quarter second). delayfeedback 0.5 repeats a few times'),
                        name: 'delay delaytime delayfeedback',
                        what: t('<b>やまびこ</b>。少し おくれて 同じ 音が くりかえす。delaytime は 間かく、delayfeedback は くりかえしの 多さ。',
                            'An <b>echo</b>. The same sound repeats a little later. delaytime is the gap, delayfeedback is how many times it repeats.'),
                        code: 'note("c4 e4").delay(.4).delaytime(.25)',
                        history: t('英語で「おくれ」。むかしは 録音テープを ループさせて やまびこを つくっていた(ローランドの Space Echo、1974年 など)。',
                            'It means "being late" in English. Long ago, people made echoes by looping recording tape (like the Roland Space Echo, 1974).')
                    },
                    {
                        id: 'gain',
                        hint: t('1 で ふつう、0.5 で 半分くらい、0 で 鳴らない', '1 is normal, 0.5 about half, 0 silent'),
                        name: 'gain',
                        what: t('<b>音の 大きさ</b>。1 が ふつう。',
                            'How <b>loud</b> the sound is. 1 is normal.'),
                        code: 's("hh*8").gain(.6)',
                        history: t('英語で「増やす、もうけ」。電気の 信号を 何倍に するか、という 意味の ことば。',
                            'In English it means "to increase" or "profit". It is a word for how many times bigger an electric signal is made.')
                    },
                    {
                        id: 'pan',
                        hint: t('0 で 左、0.5 で まんなか、1 で 右', '0 is left, 0.5 the middle, 1 right'),
                        name: 'pan',
                        what: t('<b>左右の 位置</b>。0 が 左、0.5 が まんなか、1 が 右。',
                            '<b>Left-right position</b>. 0 is left, 0.5 is the middle, 1 is right.'),
                        code: 's("hh*8").pan(sine.range(0, 1))',
                        history: t('<b>panorama</b>(パノラマ、見わたす けしき)から。音を 左右の けしきの どこに おくか、という 意味。',
                            'From <b>panorama</b> (a wide view). It means where in the left-right view you put the sound.')
                    },
                    {
                        id: 'crush',
                        hint: t('16 で ほぼ そのまま、4 で ガリガリ', '16 is almost clean, 4 very crunchy'),
                        name: 'crush',
                        what: t('音を <b>ガリガリ</b> に する(ビットクラッシャー)。数字が 小さいほど あらい。',
                            'Makes the sound <b>crunchy</b> (a bitcrusher). The smaller the number, the rougher it gets.'),
                        code: 's("bd sd").crush(4)',
                        history: t('音の 細かさ(ビット数)を 「つぶす」 から crush。むかしの ゲーム機の 8ビットの 音に 近く なる。',
                            'It "crushes" the detail of the sound (the number of bits), so it is called crush. It sounds close to the 8-bit sounds of old game consoles.')
                    },
                    {
                        id: 'distort',
                        hint: t('0 で なし、1〜3 で ひずむ', '0 is none, 1-3 distorts'),
                        name: 'distort',
                        what: t('<b>ひずみ</b>(ディストーション)。音を 歪ませて 太く、あらく する。',
                            '<b>Distortion</b>. Bends the sound to make it fat and rough.'),
                        code: 'note("a1").s("sawtooth").distort(2)',
                        history: t('エレキギターの「ひずみ」と 同じ。1950〜60年代、アンプの 音量を 上げすぎて 音が こわれたのが、かっこいい 音として 広まった。',
                            'The same as the distortion of an electric guitar. In the 1950s-60s, amps turned up too loud broke the sound, and people liked it as a cool sound.')
                    },
                    {
                        id: 'speed',
                        hint: t('1 で ふつう、2 で 2倍 速く 高く、-1 で 逆再生', '1 is normal, 2 twice as fast and high, -1 backwards'),
                        name: 'speed',
                        what: t('録音した 音の <b>再生の 速さ</b>。2 で 2倍 速く 高く、-1 で 逆再生。',
                            'The <b>playback speed</b> of a recorded sound. 2 is twice as fast and higher. -1 plays it backwards.'),
                        code: 's("bd").speed(2)',
                        history: t('レコードや テープを 速く まわすと 音が 高く なる のと 同じ しくみ。',
                            'It works the same way as spinning a record or tape faster to make the sound higher.')
                    },
                    {
                        id: 'clip',
                        hint: t('1 で 次の 音まで、0.3 で 短く 切る', '1 lasts until the next sound, 0.3 is short'),
                        name: 'clip',
                        what: t('音の <b>長さ</b>。1 で 次の 音まで、0.3 で 短く 切る。',
                            'The <b>length</b> of a sound. 1 lasts until the next sound, 0.3 cuts it short.'),
                        code: 'note("c4 e4").s("square").clip(.3)',
                        history: t('英語で「切りとる」。',
                            'It means "to cut off" in English.')
                    },
                    {
                        id: 'vowel',
                        hint: t('数字では なく 文字。a e i o u', 'Letters, not numbers: a e i o u'),
                        name: 'vowel',
                        what: t('音を「あ・い・う・え・お」の ような <b>声の 響き</b>に する。',
                            'Makes the sound like a <b>voice</b> saying vowels such as "a, e, i, o, u".'),
                        code: 's("sawtooth").vowel("<a e i o>")',
                        history: t('英語で「母音」。人の 声の 母音を つくる 響き(フォルマント)を まねる フィルター。',
                            '"Vowel" in English. It is a filter that copies the sounds (formants) that make the vowels of a human voice.')
                    },
                    {
                        id: 'unison',
                        hint: t('unison は 本数(1〜8)。detune 0.3〜0.5 で ほどよく 厚い。spread 0〜1', 'unison is the number of waves (1-8). detune 0.3-0.5 is nicely thick. spread is 0-1'),
                        name: 'unison detune spread',
                        what: t('supersaw の <b>厚み</b>。unison は かさねる 本数、detune は 高さの ずれ、spread は 左右の 広がり。',
                            'How <b>thick</b> a supersaw is. unison is the number of stacked waves, detune is how far apart the pitches are, spread is how wide it is left to right.'),
                        code: 'note("a3").s("supersaw").unison(7).detune(.4).spread(.8)',
                        history: t('<b>unison</b>(ユニゾン)は ラテン語で「1つの 音」。何人もが 同じ 音を 歌う ことだよ。<b>detune</b> は「チューニングを はずす」。',
                            '<b>Unison</b> means "one sound" in Latin. It is when many people sing the same note. <b>Detune</b> means "to put out of tune".')
                    },
                    {
                        id: 'fm',
                        hint: t('0 で なし、1〜4 で 金属っぽい', '0 is none, 1-4 metallic'),
                        name: 'fm',
                        what: t('音を <b>金属っぽく</b>、ベルや エレピの ような 音に する(FM合成)。',
                            'Makes the sound <b>metallic</b>, like a bell or an electric piano (FM synthesis).'),
                        code: 'note("c4").s("sine").fm(2)',
                        history: t('<b>f</b>requency <b>m</b>odulation(周波数変調。FM ラジオと 同じ ことば)。1967年に スタンフォード大学の ジョン・チャウニングさんが 発見し、1983年の ヤマハ <b>DX7</b> で 世界中に 広まった。',
                            '<b>F</b>requency <b>m</b>odulation (the same words as in FM radio). John Chowning at Stanford University discovered it in 1967, and the Yamaha <b>DX7</b> of 1983 spread it around the world.')
                    },
                    {
                        id: 'orbit',
                        hint: t('1〜8 の 整数。ふつうは 1', 'A whole number 1-8. Usually 1'),
                        name: 'orbit',
                        what: t('音が 通る <b>通り道</b>(1〜8)を きめる。ひびきや やまびこ、duck は 通り道ごとに かかる。',
                            'Chooses the <b>path</b> (1-8) the sound goes through. Reverb, echo and duck work separately for each path.'),
                        code: 'note("a1*8").s("sawtooth").orbit(2)',
                        history: t('英語で「軌道」。TidalCycles の 音源 SuperDirt で、トラックごとの 効果が まざらない ように 分ける しくみの 名前だよ。',
                            '"Orbit" in English. It is the name of the system in SuperDirt, the sound engine of TidalCycles, that keeps each track\'s effects apart so they do not mix.')
                    },
                    {
                        id: 'duck',
                        hint: t('数字では なく、へこませる orbit の 番号(2、2:3)。duckattack は 戻る 秒(0.1〜0.3)、duckdepth は 深さ(0〜1)', 'Not a number: the orbits to push down (2, 2:3). duckattack is the seconds to come back (0.1-0.3), duckdepth how deep (0-1)'),
                        name: 'duck duckattack duckdepth',
                        what: t('キックが 鳴るたびに、ほかの 通り道(orbit)の 音を <b>しぼませる</b>。音が 息を する ように「ポンプ」する。',
                            'Each time the kick plays, the sounds on other paths (orbits) <b>shrink</b>. The sound "pumps" as if it is breathing.'),
                        code: 's("bd*4").duck("2:3").duckattack(.2).duckdepth(.8)',
                        history: t('英語で「ひょいと 頭を 下げる」。ラジオで 話す ときに 音楽を 小さく する わざ「ダッキング」から。クラブミュージックでは「サイドチェイン」「ポンピング」とも いい、2000年代の フレンチハウスや EDM で 流行した。',
                            '"Duck" means "to quickly lower your head". It comes from "ducking", a trick of turning the music down while someone talks on the radio. In club music it is also called "sidechain" or "pumping", and it was popular in 2000s French house and EDM.')
                    }
                ]
            },
            {
                id: 'add',
                opcode: 'add',
                level: 2,
                what: t('音の 高さ(番号)に 数を <b>たす</b>。<code>&lt;0 2 4&gt;</code> の ように パターンも たせる。', '<b>Adds</b> a number to the pitch (number). You can add a pattern too, like <code>&lt;0 2 4&gt;</code>.'),
                track: [['n', {CODE: '0 2 4'}], ['add', {VALUE: '<0 2 4>'}], ['scale', {ROOT: 'C4', SCALE: 'major'}], piano],
                code: 'n("0 2 4").add(n("<0 2 4>")).scale("C4:major").s("piano")',
                result: t('同じ メロディが、つぎの サイクルで 音階の 2段 上、その つぎで 4段 上に なり、また もとに もどる。', 'The same melody goes 2 steps up the scale in the next cycle, 4 steps up in the one after, and then back.'),
                uses: t(['同じ フレーズを 高さを かえて くりかえす'], ['Repeat a phrase at different heights']),
                history: t('英語で「たす」。', 'It means "to add" in English.')
            },
            {
                id: 'rev',
                opcode: 'rev',
                level: 2,
                what: t('パターンを <b>逆さま</b>に、うしろから 鳴らす。', 'Plays the pattern <b>backwards</b>, from the end.'),
                track: [note('c4 d4 e4 g4'), ['rev', {}], piano],
                code: 'note("c4 d4 e4 g4").rev().s("piano")',
                result: t('ソ ミ レ ド と、うしろから 鳴る。', 'It plays G, E, D, C: from the end.'),
                uses: t(['「サイクルごとに変える」と くみあわせて、ときどき 逆に する'], ['Use it with every to play backwards now and then']),
                history: t('<b>reverse</b>(逆)の 略。', 'Short for <b>reverse</b>.')
            },
            {
                id: 'ply',
                opcode: 'ply',
                level: 2,
                what: t('パターンの 1つ 1つの 音を <b>N回ずつ</b> くりかえす。', 'Repeats each sound in the pattern <b>N times</b>.'),
                track: [s('bd sd'), ['ply', {TIMES: 2}]],
                code: 's("bd sd").ply(2)',
                result: t('ドンドン タンタン と、1つずつ 2回 鳴る。', 'Each sound plays twice: boom boom, clap clap.'),
                uses: t(['ハイハットの 連打(トラップ)や、フィルを つくる'], ['Make hi-hat rolls (trap) and fills']),
                history: t('英語で「(糸の)より、重ね」。1本の 糸を 何重にも する イメージだよ。TidalCycles から ある 名前。',
                    '"Ply" means a layer or a twist of thread. Think of making one thread into many layers. The name comes from TidalCycles.')
            },
            {
                id: 'every',
                opcode: 'every',
                level: 2,
                what: t('<b>Nサイクルに 1回</b> だけ、▼の かえかたを する。▼ には ぎゃく・はやく・おそく・くりかえし・1オクターブ上・5度上 が ある。',
                    'Changes the pattern in the ▼ way <b>once every N cycles</b>. ▼ has rev, fast 2, slow 2, ply 2, transpose 12 and transpose 7.'),
                track: [note('c4 e4 g4'), ['every', {CYCLES: 4, TRANSFORM: 'rev'}], piano],
                code: 'note("c4 e4 g4").every(4, x => x.rev()).s("piano")',
                result: t('4サイクルに 1回、メロディが 逆に なる。', 'Once in four cycles, the melody plays backwards.'),
                uses: t(['ずっと 同じに ならない ように、ときどき 変化を つける(フィル)'], ['Add a change now and then, so that the loop does not stay the same (fills)']),
                history: t('英語で「〜ごとに」。TidalCycles の はじめの ころから ある、いちばん 有名な 関数の 1つ。',
                    'It means "every" in English. One of the most famous functions, there since the early days of TidalCycles.')
            },
            {
                id: 'degradeBy',
                opcode: 'degradeBy',
                level: 3,
                what: t('音を <b>確率で</b> 休ませる。30 なら、30% の 音が 鳴らない。', 'Leaves out sounds <b>by chance</b>. With 30, 30% of the sounds do not play.'),
                track: [s('hh*16'), ['degradeBy', {PERCENT: 30}]],
                code: 's("hh*16").degradeBy(0.3)',
                result: t('ハイハットが ところどころ ぬけて、人が たたいている ように 聞こえる。', 'Some hi-hats drop out, and it sounds like a person playing.'),
                uses: t(['こまかい ハイハットを まばらに して、ループに ゆらぎを つける'], ['Make fast hi-hats sparse to make a loop feel alive']),
                history: t('<b>degrade</b> は「質を 落とす、こわす」。ミニ記法の <code>?</code> と 同じ(<code>"hh*16?"</code>)。',
                    '<b>Degrade</b> means "to make worse" or "to break down". It is the same as <code>?</code> in mini-notation (<code>"hh*16?"</code>).')
            },
            {
                id: 'sometimes',
                opcode: 'sometimes',
                level: 3,
                what: t('<b>ときどき</b>(半分 くらいの 音に)▼の かえかたを する。', 'Changes the pattern in the ▼ way <b>sometimes</b> (on about half of the sounds).'),
                track: [note('c4*8'), ['sometimes', {TRANSFORM: 'up12'}], piano],
                code: 'note("c4*8").sometimes(x => x.transpose(12)).s("piano")',
                result: t('ド の うち ときどき 1オクターブ 上の ド が まざる。', 'Now and then a C plays an octave higher.'),
                uses: t(['同じ 音の くりかえしに、毎回 ちがう 変化を つける'], ['Give a repeated note a different change each time']),
                history: t('英語で「ときどき」。仲間に <code>often</code>(よく)、<code>rarely</code>(たまに)も あるよ。',
                    'It means "sometimes" in English. Its friends are <code>often</code> and <code>rarely</code>.')
            },
            {
                id: 'euclid',
                opcode: 'euclid',
                level: 3,
                what: t('Nこの 音を、Mこの マスに <b>できるだけ 均等に</b> ちらす。(3, 8) は 世界中の 音楽で 聞こえる リズム。',
                    'Spreads N sounds over M steps <b>as evenly as possible</b>. (3, 8) is a rhythm you can hear in music all over the world.'),
                track: [s('rim'), ['euclid', {PULSES: 3, STEPS: 8}]],
                code: 's("rim").euclid(3, 8)',
                result: t('カッ・・カッ・・カッ・ と、3・3・2 の リズムで 鳴る。', 'It plays in 3, 3, 2: tock, tock, tock.'),
                uses: t(['4つ打ちの 上に 重ねて、ひっかかりの ある リズムに する(<a href="rhythms.html#euclid">リズム図鑑</a>)'],
                    ['Stack it on four on the floor for a catchy offset (<a href="rhythms.html#euclid">rhythm book</a>)']),
                history: t('計算幾何学者の ゴドフリー・トゥーサンさんが、2つの 数の 最大公約数を もとめる「<b>ユークリッドの 互除法</b>」(2300年ほど 前の 古代ギリシャの 数学)と 同じ 手順で、キューバや アフリカの 伝統的な リズムが つくれる ことを 2004〜2005年ごろの 論文で 示した。もとの 手順は、物理学者の ビョークランドさんが 加速器の タイミングを きめる ために つかっていた ものだよ。',
                    'Godfried Toussaint, a computational geometry researcher, showed in papers around 2004-2005 that traditional rhythms from Cuba and Africa can be made with the same steps as the "<b>Euclidean algorithm</b>". That is ancient Greek math from about 2300 years ago, for finding the greatest common divisor of two numbers. The original steps were used by Bjorklund, a physicist, to set the timing of a particle accelerator.')
            },
            {
                id: 'jux',
                opcode: 'jux',
                level: 3,
                what: t('音を 左右に 分けて、<b>右だけ</b> ▼の かえかたを する。左右で ちがう 音が 鳴って 広がる。',
                    'Splits the sound into left and right, and changes <b>only the right</b> in the ▼ way. Left and right play different sounds, so it sounds wide.'),
                track: [s('bd hh sd hh'), ['jux', {TRANSFORM: 'rev'}]],
                code: 's("bd hh sd hh").jux(x => x.rev())',
                result: t('左は ふつうに、右は 逆さまに 鳴る(イヤホンで 聞いてね)。', 'The left plays as usual and the right plays backwards (use headphones).'),
                uses: t(['音を 左右に 広げる'], ['Make the sound wide']),
                history: t('<b>juxtapose</b>(ならべて おく)の 略。TidalCycles 生まれの 名前。', 'Short for <b>juxtapose</b> (to put side by side). A name born in TidalCycles.')
            },
            {
                id: 'off',
                opcode: 'off',
                level: 3,
                what: t('少し <b>おくらせて</b>、▼の かえかたを した ものを かさねる。', 'Takes the pattern, <b>delays</b> it a little, changes it in the ▼ way, and stacks it on top.'),
                track: [note('c4 e4'), ['off', {TIME: '0.125', TRANSFORM: 'up7'}], piano],
                code: 'note("c4 e4").off(0.125, x => x.transpose(7)).s("piano")',
                result: t('ド の 少し あとに ソ、ミ の 少し あとに シ が 鳴る。', 'G plays just after C, and B just after E.'),
                uses: t(['やまびこの ような、ずれた ハモリを つける'], ['Add a shifted harmony, like an echo']),
                history: t('英語で「ずれて、はなれて」。TidalCycles から ある 名前。', 'It means "shifted" or "away" in English. The name comes from TidalCycles.')
            },
            {
                id: 'superimpose',
                opcode: 'superimpose',
                level: 3,
                what: t('▼の かえかたを した ものを、もとの パターンに <b>かさねる</b>。', '<b>Stacks</b> a copy changed in the ▼ way on top of the original pattern.'),
                track: [note('c4 e4'), ['superimpose', {TRANSFORM: 'up12'}], piano],
                code: 'note("c4 e4").superimpose(x => x.transpose(12)).s("piano")',
                result: t('ド と 1オクターブ 上の ド が いっしょに 鳴る。', 'C plays with the C an octave higher.'),
                uses: t(['リードを 分厚く する'], ['Make a lead thicker']),
                history: t('英語で「重ねあわせる」。写真を 二重に うつす 技法(スーパーインポーズ)と 同じ ことば。',
                    'It means "to lay one thing over another". It is the same word as the photo trick of showing two pictures at once (superimposing).')
            },
            {
                id: 'chop',
                opcode: 'chop',
                level: 3,
                what: t('1つの 音を <b>Nこに 切って</b>、細かく 鳴らす。', '<b>Cuts</b> one sound <b>into N pieces</b> and plays them in small bits.'),
                track: [s('bd'), ['chop', {PIECES: 4}]],
                code: 's("bd").chop(4)',
                result: t('キックが 4つに 切られて、ドゥ ドゥ ドゥ ドゥ と 細かく 鳴る。', 'The kick is cut into 4 pieces which play one after another.'),
                uses: t(['録音した 声を 切って ならべなおす(<a href="tutorial.html#step10">チュートリアル 10章</a>)'], ['Cut a recorded voice and play the pieces (<a href="tutorial.html#step10">tutorial step 10</a>)']),
                history: t('英語で「切る、きざむ」。録音した 音を 細かく 切って ならべなおすのは、1980年代の サンプラーから 広まった ヒップホップの わざだよ。',
                    'It means "to cut" or "to chop" in English. Cutting recorded sounds into small pieces and rearranging them is a hip-hop trick that spread with the samplers of the 1980s.')
            },
            {
                id: 'transpose',
                opcode: 'transpose',
                level: 3,
                what: t('音を <b>半音 N個ぶん</b> 上げる(マイナスなら 下げる)。12 で 1オクターブ。', 'Moves the notes up by <b>N half steps</b> (down if N is negative). 12 is one octave.'),
                track: [note('c4 e4 g4'), ['transpose', {SEMITONES: -12}], piano],
                code: 'note("c4 e4 g4").transpose(-12).s("piano")',
                result: t('ド ミ ソ が 1オクターブ 低く 鳴る。', 'C, E, G play an octave lower.'),
                uses: t(['メロディを ベースの 高さに 下げる'], ['Move a melody down to bass height']),
                history: t('音楽の ことばで「移調」。歌いやすい 高さに 曲ぜんたいを ずらす ときに つかう。',
                    'A music word. It means moving a whole song higher or lower, for example to make it easier to sing.')
            },
            {
                id: 'arp',
                opcode: 'arp',
                level: 3,
                what: t('和音の 音を、番号の 順に <b>1つずつ</b> 鳴らす(アルペジオ)。0 が 一番 低い 音。', 'Plays the notes of a chord <b>one at a time</b>, in the order of the numbers (an arpeggio). 0 is the lowest note.'),
                track: [['chord', {ROOT: 'C4', CHORD: 'major'}], ['arp', {ORDER: '0 1 2 1'}], piano],
                code: 'note("[c4,e4,g4]").arp("0 1 2 1").s("piano")',
                result: t('ド ミ ソ ミ と、和音が 1音ずつ 鳴る。', 'The chord plays one note at a time: C, E, G, E.'),
                uses: t(['トランスの キラキラした プラックや、ピアノの 伴奏'], ['Sparkly trance plucks, or a piano accompaniment']),
                history: t('<b>arpeggio</b>(アルペジオ)の 略。イタリア語の arpa(ハープ)から。ハープの ように 和音を ばらして 弾く ことだよ。',
                    'Short for <b>arpeggio</b>. It comes from arpa, the Italian word for harp. It means playing the notes of a chord one by one, like on a harp.')
            },
            {
                id: 'acidenv',
                opcode: 'acidenv',
                level: 3,
                what: t('ノコギリ波と フィルターを セットに して、<b>アシッド</b>の「ビヨビヨ」した 音に する。数字が 大きいほど よく うごく。',
                    'Puts a sawtooth wave and a filter together for the "bwow-bwow" sound of <b>acid</b> music. The bigger the number, the more it moves.'),
                track: [note('a1*16'), ['acidenv', {AMOUNT: 0.6}]],
                code: 'note("a1*16").s("sawtooth").lpf(100).lpenv(5.4).lps(0.2).lpd(0.12).lpq(2)',
                result: t('ベースが 16分音符で ビヨビヨ 鳴る。', 'The bass plays sixteenth notes: bwow bwow.'),
                uses: t(['アシッドハウスの ベース(<a href="tutorial.html#step12">チュートリアル 12章</a>)'], ['An acid house bass (<a href="tutorial.html#step12">tutorial step 12</a>)']),
                history: t('1981年の ローランド <b>TB-303</b> は、ベースの かわりの 機械として 売れなかった。でも 1987年、シカゴの Phuture が つまみを ぐるぐる 回して つくった「Acid Tracks」から「アシッドハウス」が 生まれた。名前は Switch Angel さんの strudel-scripts の 関数 <code>acidenv</code> から もらったよ。書き出すと s・lpf・lpenv・lps・lpd・lpq が ならぶ。',
                    'The Roland <b>TB-303</b> from 1981 was made to replace a bass player, but it did not sell. Then in 1987, Phuture in Chicago made "Acid Tracks" by turning its knobs round and round, and "acid house" was born. The name comes from the function <code>acidenv</code> in Switch Angel\'s strudel-scripts. It is exported as s, lpf, lpenv, lps, lpd and lpq.')
            },
            {
                id: 'trancegate',
                opcode: 'trancegate',
                level: 3,
                what: t('長い 和音を 細かく <b>きざんで</b>、トランスの「タタタタ」と いう 音に する。1つめの 数字が 鳴る マスの 多さ、2つめが リズムの たね(かえると ちがう リズム)。',
                    '<b>Chops</b> a long chord into small pieces for the "ta-ta-ta-ta" sound of trance. The first number is how many steps play, the second is the seed of the rhythm (change it for another rhythm).'),
                track: [note('[a3,c4,e4]'), s('supersaw'), ['trancegate', {DENSITY: 0.7, SEED: 12, LENGTH: 1}]],
                code: 'note("[a3,c4,e4]").s("supersaw").struct(rand.mul(1.2).round().seg(16).rib(12, 1)).fillGaps().clip(0.7)',
                result: t('分厚い 和音が タタ・タタタ と きざまれる。', 'The thick chord is chopped: ta-ta, ta-ta-ta.'),
                uses: t(['トランスの パッド(<a href="tutorial.html#step12">チュートリアル 12章</a>)'], ['A trance pad (<a href="tutorial.html#step12">tutorial step 12</a>)']),
                history: t('トランスという 音楽で 1990年代の おわりごろから よく つかわれる「ゲート」(音を 開け閉めする 門)の わざ。名前は Switch Angel さんの strudel-scripts の 関数 <code>trancegate</code> から。書き出すと struct・fillGaps・clip に なる。',
                    'A "gate" trick (a gate that opens and closes the sound), used a lot in trance music since the late 1990s. The name comes from the function <code>trancegate</code> in Switch Angel\'s strudel-scripts. It is exported as struct, fillGaps and clip.')
            }
        ]
    },
    {
        id: 'values',
        title: t('値の ブロック', 'Value blocks'),
        lead: t('丸い ブロックは、ほかの ブロックの 欄に 入れて つかう。', 'Round blocks go into the inputs of other blocks.'),
        entries: [
            {
                id: 'listMini',
                opcode: 'listMini',
                level: 2,
                what: t('Scratch の <b>リスト</b>の 中身を ならべて、ミニ記法に する。▼ で ならべかたを えらぶ。「1サイクルに1つずつ」は 1行が 1小節、「1サイクルの中に順番に」は 1サイクルに ぜんぶ、「ぜんぶ同時に」は 重ねる。',
                    'Turns the items of a Scratch <b>list</b> into mini-notation. Choose how in ▼: "one in each cycle" plays a line a bar, "in order in a cycle" plays all of them in a cycle, "all together" stacks them.'),
                script: (b, $) => {
                    const melody = b.list('メロディ', ['c4 e4', 'g4 e4', 'a4 g4', 'e4 d4']);
                    return [$.track(EXAMPLE_TRACK, [$.note($.listMini(melody, 'cycle')), $.s('piano')])];
                },
                result: t('リスト「メロディ」には <code>c4 e4</code>、<code>g4 e4</code>、<code>a4 g4</code>、<code>e4 d4</code> の 4行が 入っている。1行が 1小節ずつ 順番に 鳴るよ。', 'The list "melody" has four lines: <code>c4 e4</code>, <code>g4 e4</code>, <code>a4 g4</code> and <code>e4 d4</code>. Each line plays for a bar, in order.'),
                uses: t(['長い メロディや コード進行を、1小節ずつ リストに 書く(<a href="tutorial.html#step9">チュートリアル 9章</a>)', 'ドラムを 楽器ごとに 1行ずつ 書いて「ぜんぶ同時に」で 重ねる'],
                    ['Write a long melody or chord progression a bar at a time in a list (<a href="tutorial.html#step9">tutorial step 9</a>)', 'Write a line for each drum and stack them with "all together"']),
                code: 'note("<[c4 e4] [g4 e4] [a4 g4] [e4 d4]>").s("piano")',
                history: t('Strudel には リストが ないので、書き出すと ミニ記法の <code>&lt; &gt;</code>(1サイクルずつ)、<code>[ ]</code>(順番に)、<code>,</code>(同時に)に なるよ。',
                    'Strudel has no lists, so they are exported as mini-notation: <code>&lt; &gt;</code> (one in each cycle), <code>[ ]</code> (in order) and <code>,</code> (together).')
            },
            {
                id: 'range',
                opcode: 'wave',
                level: 3,
                what: t('時間で <b>ゆれる 値</b>。波の 形を えらび、何から 何まで、何サイクルで ゆれるかを きめる。数字の かわりに 効果に 入れると、音が ゆっくり かわっていく。',
                    '<b>A value which moves</b> over time. Choose the shape of the wave, from what to what, and how many cycles it takes. Put it into an effect instead of a number, and the sound slowly changes.'),
                track: [note('c2*8'), s('sawtooth'), ['effect', {EFFECT: 'lpf', VALUE: {wave: ['sine', 200, 2000, 4]}}]],
                code: 'note("c2*8").s("sawtooth").lpf(sine.range(200, 2000).slow(4))',
                result: t('ベースが 4サイクル かけて こもったり 明るく なったり する。', 'Over four cycles the bass goes muffled and bright and back.'),
                uses: t(['フィルターを ゆっくり 開いて もりあげる(<a href="rhythms.html#filter">リズム図鑑</a>)', '「音の大きさ」に 入れて、だんだん 大きく する'],
                    ['Open the filter slowly to build up (<a href="rhythms.html#filter">rhythm book</a>)', 'Put it in gain to get louder little by little']),
                history: t('シンセサイザーの「<b>LFO</b>」(ゆっくり ゆれる 波)と 同じ はたらき。波の 形の <b>ゆらゆら</b>(perlin)は ケン・パーリンさんが 1983年に つくった「なめらかな 乱数」で、映画の CG を 自然に 見せる ために 生まれ、1997年に アカデミー賞(科学技術賞)を もらった。',
                    'It works like an "<b>LFO</b>" (a slowly moving wave) on a synthesizer. <b>perlin</b> is a "smooth random number" made by Ken Perlin in 1983. It was made to make movie CG look natural, and it won an Academy Award (for science and technology) in 1997.')
            },
            {
                id: 'irand',
                opcode: 'randomSteps',
                level: 3,
                what: t('<b>乱数</b>で 番号を つくる。何から 何まで、1サイクルに 何こ、どの「たね」の 乱数を 何サイクル くりかえすかを きめる。同じ たねなら いつも 同じ フレーズに なるよ。',
                    'Makes numbers with <b>random numbers</b>: from what to what, how many in a cycle, and which seed to repeat for how many cycles. The same seed always gives the same phrase.'),
                track: [['n', {CODE: {random: [0, 7, 8, 3, 1]}}], ['scale', {ROOT: 'C4', SCALE: 'minor:pentatonic'}], piano],
                code: 'n(irand(8).add(0).seg(8).rib(3, 1)).scale("C4:minor:pentatonic").s("piano")',
                result: t('音階の 中で ランダムな 8つの 音が 鳴り、毎サイクル 同じ フレーズを くりかえす。', 'Eight random notes of the scale play, and the same phrase repeats every cycle.'),
                uses: t(['たねを かえながら、気に入った メロディを さがす'], ['Change the seed to find a melody you like']),
                history: t('<b>irand</b> = <b>i</b>nteger(整数)の <b>rand</b>om(乱数)。<b>seg</b> = <b>seg</b>ment(区切る)、<b>rib</b> = <b>rib</b>bon(リボン)の 略。',
                    '<b>irand</b> = <b>rand</b>om <b>i</b>nteger (whole number). <b>seg</b> = short for <b>seg</b>ment (to split up), <b>rib</b> = short for <b>rib</b>bon.')
            }
        ]
    },
    {
        id: 'move',
        title: t('音に あわせて 動かす', 'Moving with the music'),
        entries: [
            {
                id: 'whenBeat',
                opcode: 'whenBeat',
                level: 1,
                what: t('<b>拍が くるたびに</b>、下の ブロックを 動かす。1サイクルが 4拍なら、1サイクルに 4回。', 'Runs the blocks below <b>on every beat</b>: 4 times a cycle when a cycle has 4 beats.'),
                script: b => [b.strudel('whenBeat'), b.block('looks_nextcostume')],
                result: t('拍に あわせて ねこが 歩く ように コスチュームを かえる。', 'The cat changes its costume on every beat, as if it walks.'),
                uses: t(['スプライトを 音楽に あわせて おどらせる'], ['Make sprites dance to the music']),
                code: null,
                history: t('Strudel には ない、Scratch の ための ブロック。音が 鳴る 時間に あわせて 動くので、画面と 音が ずれないよ。',
                    'Strudel does not have it: it is a block for Scratch. It runs at the time the sound plays, so the picture and the sound stay together.')
            },
            {
                id: 'whenSound',
                opcode: 'whenSound',
                level: 1,
                what: t('えらんだ <b>音が 鳴るたびに</b>、下の ブロックを 動かす。', 'Runs the blocks below <b>each time the chosen sound plays</b>.'),
                script: b => {
                    const hat = b.strudel('whenSound', {}, {DRUM: 'bd'});
                    const big = b.block('looks_changesizeby');
                    b.number(big, 'CHANGE', 10);
                    return [hat, big];
                },
                result: t('キックが 鳴るたびに、ねこが 少し 大きく なる。', 'The cat gets a little bigger each time the kick plays.'),
                uses: t(['キックで はねる、スネアで 色を かえる など、楽器ごとに ちがう 動きを つける'], ['Jump on the kick, change color on the snare: a different move for each drum']),
                code: null,
                history: t('Strudel には ない、Scratch の ための ブロック。', 'Strudel does not have it: it is a block for Scratch.')
            },
            {
                id: 'beatInCycle',
                opcode: 'beatInCycle',
                level: 1,
                what: t('今が サイクルの <b>何拍目</b>か(1, 2, 3, 4)。音が 鳴っていない ときは 0。', '<b>Which beat</b> of the cycle it is now (1, 2, 3, 4). 0 when nothing is playing.'),
                script: b => {
                    const say = b.block('looks_say');
                    b.text(say, 'MESSAGE', '');
                    b.put(say, 'MESSAGE', b.strudel('beatInCycle'));
                    return [b.strudel('whenBeat'), say];
                },
                result: t('ねこが 1, 2, 3, 4 と 拍を 数える。', 'The cat counts the beats: 1, 2, 3, 4.'),
                uses: t(['「もし 拍 = 1 なら」で、小節の あたまだけ 動きを かえる'], ['Use "if beat = 1" to move differently at the start of each bar']),
                code: null,
                history: t('Strudel には ない、Scratch の ための ブロック。', 'Strudel does not have it: it is a block for Scratch.')
            },
            {
                id: 'cycle',
                opcode: 'cycle',
                level: 1,
                what: t('今が 何サイクル目か(0 から 数える)。', 'Which cycle it is now (counting from 0).'),
                script: b => {
                    const say = b.block('looks_say');
                    b.text(say, 'MESSAGE', '');
                    b.put(say, 'MESSAGE', b.strudel('cycle'));
                    return [b.strudel('whenBeat'), say];
                },
                result: t('ねこが サイクルの 数を 言う。', 'The cat says the number of the cycle.'),
                uses: t(['8サイクルごとに 背景を かえる など、曲の 進みに あわせて 画面を かえる'], ['Change the backdrop every 8 cycles: follow the song with the picture']),
                code: null,
                history: t('サイクルは Strudel(TidalCycles)の 時間の 単位。この 拡張では ふつう 1サイクル = 4拍 = 1小節 だよ(<a href="tutorial.html#cycle">サイクルって なに?</a>)。',
                    'The cycle is the unit of time of Strudel (TidalCycles). In this extension a cycle is usually 4 beats, a bar (<a href="tutorial.html#cycle">what is a cycle?</a>).')
            }
        ]
    },
    {
        id: 'code',
        title: t('Strudel の コード', 'Strudel code'),
        entries: [
            {
                id: 'strudelCode',
                opcode: 'strudelCode',
                level: 2,
                what: t('鳴っている <b>全部の トラック</b>を、Strudel の コードに した 文字。', 'The text of the Strudel code of <b>all the tracks</b> which are playing.'),
                script: b => {
                    const say = b.block('looks_say');
                    b.text(say, 'MESSAGE', '');
                    b.put(say, 'MESSAGE', b.strudel('strudelCode'));
                    return [b.whenKey('c'), say];
                },
                result: t('C キーを おすと、ねこが 今の コードを 言う。', 'Press C, and the cat says the code.'),
                uses: t(['ブロックが どんな コードに なるかを たしかめる'], ['See what code your blocks make']),
                code: null,
                history: t('いちばん 上に テンポの <code>setcpm(…)</code>、つづけて トラックごとに <code>$:</code> の 1行が ならぶ。',
                    'It starts with the tempo <code>setcpm(…)</code>, then a <code>$:</code> line for each track.')
            },
            {
                id: 'openStrudel',
                opcode: 'openStrudel',
                level: 2,
                what: t('鳴っている 全部の トラックを、<b>strudel.cc</b>(ブラウザで Strudel を 書ける サイト)で 開く。', 'Opens all the tracks which are playing in <b>strudel.cc</b> (the site where you write Strudel in the browser).'),
                script: b => [b.whenKey('o'), b.strudel('openStrudel')],
                result: t('O キーを おすと、新しい タブで strudel.cc が 開いて、同じ 曲の コードが 入っている。', 'Press O, and strudel.cc opens in a new tab with the code of the same song.'),
                uses: t(['ブロックで 作った 曲を、コードで 書きかえて つづける(<a href="tutorial.html#code">チュートリアルの コラム</a>)'], ['Keep working on your block song as code (<a href="tutorial.html#code">tutorial column</a>)']),
                code: null,
                history: t('strudel.cc は Strudel の 作者たちが 公開している サイト。コードは アドレスの # の うしろに 入って とどく。',
                    'strudel.cc is the site of the makers of Strudel. The code travels after the # of the address.')
            }
        ]
    },
    {
        id: 'viz',
        title: t('音を 見る', 'Seeing the sound'),
        entries: [
            {
                id: 'showViz',
                opcode: 'showViz',
                level: 1,
                what: t('ステージに <b>音の 絵</b>を 出す。▼で 絵の 種類を えらぶよ。', 'Shows <b>a picture of the sound</b> on the stage. Choose the kind of picture in ▼.'),
                script: b => [b.block('event_whenflagclicked'), b.strudel('showViz', {}, {VIZ: 'pianoroll'})],
                result: t('ステージに ピアノロールが 出て、鳴っている 音が 帯で 流れる。', 'A piano roll appears on the stage, and the notes flow by as bars.'),
                uses: t(['メロディは ピアノロール、ドラムは パンチカード、音色は スコープや スペクトルで 見る'], ['See melodies on the piano roll, drums on the punch card, sounds on the scope or spectrum']),
                code: 'note("c4 e4 g4")._pianoroll()',
                history: t('Strudel では パターンの うしろに <code>._pianoroll()</code> などを つける。', 'In Strudel, add <code>._pianoroll()</code> or another one after the pattern.'),
                items: [
                    {
                        id: 'scope',
                        name: 'scope',
                        what: t('音の <b>波の 形</b>を 線で 見せる。',
                            'Shows the <b>shape of the sound wave</b> as a line.'),
                        code: 's("sawtooth")._scope()',
                        history: t('<b>oscilloscope</b>(オシロスコープ)の 略。電気の 波を 見る 測定器。',
                            'Short for <b>oscilloscope</b>, a tool for looking at electric waves.')
                    },
                    {
                        id: 'pianoroll',
                        name: 'pianoroll',
                        what: t('音の 高さと 長さを、横に 流れる 帯で 見せる。',
                            'Shows the pitch and length of notes as bars that flow sideways.'),
                        code: 'note("c4 e4 g4")._pianoroll()',
                        history: t('1900年ごろの 自動ピアノは、穴の あいた 紙の ロール(巻物)で 曲を 演奏した。その 見た目が もとに なった 名前。',
                            'Around 1900, player pianos played songs from paper rolls with holes in them. The name comes from how those looked.')
                    },
                    {
                        id: 'spectrum',
                        name: 'spectrum',
                        what: t('低い 音から 高い 音まで、どれが どれくらい 鳴っているかを 見せる。',
                            'Shows how much of each sound is playing, from low to high.'),
                        code: 's("bd hh")._spectrum()',
                        history: t('英語で「スペクトル」。光を プリズムに 通すと 虹色に 分かれる ように、音を 高さごとに 分けて 見る。',
                            '"Spectrum" in English. Light going through a prism splits into rainbow colors. In the same way, this splits sound by pitch so you can see it.')
                    },
                    {
                        id: 'punchcard',
                        name: 'punchcard',
                        what: t('ピアノロールを 穴の あいた カードの ように 見せる。',
                            'Shows the piano roll like a card with holes in it.'),
                        code: 'note("c4 e4 g4")._punchcard()',
                        history: t('<b>パンチカード</b>は 穴の 位置で 情報を あらわす カード。1800年代の はじめ、ジャカールの 織機が 布の 模様を あやつる のに つかい、のちに コンピューターにも つかわれた。',
                            'A <b>punch card</b> is a card that stores information by where its holes are. In the early 1800s, the Jacquard loom used them to control the patterns of cloth. Later they were used in computers too.')
                    }
                ]
            },
            {
                id: 'hideViz',
                opcode: 'hideViz',
                level: 1,
                what: t('ステージの 音の 絵を <b>消す</b>。', '<b>Hides</b> the picture of the sound on the stage.'),
                script: b => [b.whenKey('h'), b.strudel('hideViz')],
                result: t('H キーを おすと、音の 絵が 消える。', 'Press H, and the picture goes away.'),
                uses: t(['ゲームの 画面に もどす'], ['Go back to the game screen']),
                code: null,
                history: t('Strudel では <code>._pianoroll()</code> などを 消す。', 'In Strudel, remove <code>._pianoroll()</code> and the like.')
            },
            {
                id: 'vizLayer',
                opcode: 'vizLayer',
                level: 2,
                what: t('音の 絵を スプライトの <b>前</b>に 出すか、<b>後ろ</b>に 出すかを きめる。', 'Puts the picture of the sound <b>in front of</b> or <b>behind</b> the sprites.'),
                script: b => [b.block('event_whenflagclicked'), b.strudel('vizLayer', {}, {LAYER: 'front'})],
                result: t('音の 絵が ねこの 前に 出る。', 'The picture comes in front of the cat.'),
                uses: t(['後ろに して、音の 絵を 背景の ように つかう'], ['Put it behind to use the picture as a backdrop']),
                code: null,
                history: t('Strudel には ない、Scratch の ための ブロック。', 'Strudel does not have it: it is a block for Scratch.')
            }
        ]
    },
    {
        id: 'drumkit',
        title: t('ドラムの 音源', 'Drum sounds'),
        entries: [
            {
                id: 'setDrumKit',
                opcode: 'setDrumKit',
                level: 2,
                what: t('ドラムの 音を、strudel.cc と 同じ <b>録音した 音</b>(uzu-drumkit)に するか、<b>合成した 音</b>(ネットなしで 鳴る)に するかを えらぶ。ふつうは 合成。まだ ためしている 機能だよ。',
                    'Chooses whether the drums are the <b>recorded sounds</b> of strudel.cc (uzu-drumkit) or <b>synthesized sounds</b> (which play without the network). Usually synthesized. It is still an experiment.'),
                script: b => [b.block('event_whenflagclicked'), b.strudel('setDrumKit', {}, {KIT: 'uzu'})],
                result: t('ドラムが strudel.cc と 同じ 音に なる。', 'The drums sound the same as in strudel.cc.'),
                uses: t(['strudel.cc で 鳴らした ときと 同じ 音で 曲を つくる'], ['Make a song with the same sounds as in strudel.cc']),
                code: null,
                history: t('uzu-drumkit は strudel.cc の ふつうの ドラムの 音。ドラムマシン(bank)を えらぶと、そちらの 音に なるよ。',
                    'uzu-drumkit is the usual drum kit of strudel.cc. With a drum machine (bank), the drums use its sounds.')
            }
        ]
    }
];
