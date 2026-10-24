/**
 * Rhythms and techniques of the rhythm book (rhythms.html and projects/rhythms.sb3, projects/techniques.sb3).
 * A track is the blocks in the C block "play on track" from the top, as the tests write them:
 * [opcode, args] or [opcode, args, blocks in the C block]. A value of a wave is {wave: [shape, min, max, cycles]}.
 * `code` is the Strudel code of the track, which test/unit/rhythm-book.test.js checks.
 */

/** Steps in a cycle: a cycle is a bar of 4 beats, and a beat has 4 steps. */
export const STEPS = 16;

/** Names of the drum sounds, for the rows of the grids. */
export const DRUMS = {
    bd: {ja: 'キック', en: 'kick'},
    sd: {ja: 'スネア', en: 'snare'},
    cp: {ja: 'クラップ', en: 'clap'},
    rim: {ja: 'リム', en: 'rim'},
    hh: {ja: 'ハイハット', en: 'hi-hat'},
    oh: {ja: 'オープンハイハット', en: 'open hat'}
};

const s = code => ['s', {CODE: code}];
const beat = beats => ['beat', {BEATS: beats, STEPS}];
const bank = machine => ['bank', {MACHINE: machine}];
const also = (...steps) => ['stackBranch', {}, steps];

export const RHYTHMS = [
    {
        id: 'house',
        key: '1',
        bpm: 124,
        name: {ja: 'ハウス', en: 'House'},
        track: [s('bd*4'), also(s('[~ oh]*4')), also(s('[~ cp]*2')), bank('RolandTR909')],
        code: 'stack(s("bd*4"), s("[~ oh]*4"), s("[~ cp]*2")).bank("RolandTR909")',
        about: {
            ja: 'キックが 1拍ずつ ドン ドン ドン ドン と 鳴る「4つ打ち」。キックの あいだ(裏)で オープンハイハットが ツー と 鳴るのが ハウスらしさ だよ。',
            en: 'The kick plays on every beat: four on the floor. The open hat between the kicks (on the off-beat) makes it house.'
        },
        tips: {
            ja: [
                'オープンハイハットを <code>hh*16</code> に かえて、16分の きざみに する',
                'クラップを <code>[~ cp]*4</code> に して、手数を ふやす',
                'ドラムマシンを <code>RolandTR808</code> に かえて、やわらかい 音に する'
            ],
            en: [
                'Change the open hat to <code>hh*16</code> for sixteenth notes',
                'Make the clap <code>[~ cp]*4</code> for more claps',
                'Change the drum machine to <code>RolandTR808</code> for a softer sound'
            ]
        },
        history: {
            ja: '1980年代の アメリカ・シカゴの クラブ「ウェアハウス(Warehouse)」で 生まれた。DJ の フランキー・ナックルズさんが かけていた 音楽が「ハウス」と よばれるように なったよ。キックの 音には ローランドの TR-909 が よく つかわれた。',
            en: 'Born in the 1980s at the Warehouse, a club in Chicago. The music which the DJ Frankie Knuckles played there came to be called house. The Roland TR-909 was often used for the kick.'
        }
    },
    {
        id: 'disco',
        key: '2',
        bpm: 118,
        name: {ja: 'ディスコ', en: 'Disco'},
        track: [s('bd*4'), also(s('[hh oh]*4')), also(s('[~ sd]*2')), bank('RolandTR909')],
        code: 'stack(s("bd*4"), s("[hh oh]*4"), s("[~ sd]*2")).bank("RolandTR909")',
        about: {
            ja: '4つ打ちの キックに、ハイハットが チッ ツー チッ ツー と 表と 裏で 交互に 鳴る。2拍目と 4拍目の スネアで 体が ゆれるよ。',
            en: 'The hats play closed and open in turns over the four-on-the-floor kick. The snare on beats 2 and 4 makes you move.'
        },
        tips: {
            ja: [
                'スネアの 上に <code>[~ cp]*2</code> を 重ねて、音を 太く する',
                'BPM を 124 に 上げて、ハウスと くらべる',
                'ハイハットを <code>[hh hh oh hh]*2</code> に して、オープンを へらす'
            ],
            en: [
                'Stack <code>[~ cp]*2</code> on the snare for a fatter sound',
                'Raise the BPM to 124 and compare it with house',
                'Make the hats <code>[hh hh oh hh]*2</code> for fewer open hats'
            ]
        },
        history: {
            ja: '1970年代の ニューヨークで 大はやり した ダンス音楽。名前は フランス語の discothèque(レコードを かける お店)から。ハウスは ディスコを 機械で つくりなおした ものなんだ。',
            en: 'Dance music which was a big hit in New York in the 1970s. The name comes from the French word discothèque, a place where records are played. House remade disco with machines.'
        }
    },
    {
        id: 'rock',
        key: '3',
        bpm: 120,
        name: {ja: '8ビート', en: 'Eight beat'},
        track: [s('bd'), beat('0,8,10'), also(s('[~ sd]*2')), also(s('hh*8')), bank('RolandTR909')],
        code: 'stack(s("bd").beat("0,8,10", 16), s("[~ sd]*2"), s("hh*8")).bank("RolandTR909")',
        about: {
            ja: 'ハイハットが 8分音符で 8回 きざむ、ロックや ポップスの 基本。キックは 1拍目と 3拍目、スネアは 2拍目と 4拍目。キックを 1つ ずらすだけで、ノリが かわるよ。',
            en: 'The hi-hat plays eight eighth notes: the base of rock and pop. The kick plays on beats 1 and 3, the snare on 2 and 4. Moving a kick changes the feel.'
        },
        tips: {
            ja: [
                'キックの マスを <code>0,6,8,10</code> に して、つまずくような キックに する',
                'ハイハットを <code>hh*16</code> に して、16ビートに する',
                'BPM を 160 に 上げて、パンクの スピードに する'
            ],
            en: [
                'Make the kick steps <code>0,6,8,10</code> for a stumbling kick',
                'Make the hats <code>hh*16</code> for a sixteen beat',
                'Raise the BPM to 160 for punk speed'
            ]
        },
        history: {
            ja: '1950〜60年代の ロックンロールから 広まった。ビートルズも ローリング・ストーンズも、この リズムが 土台に なっているよ。',
            en: 'It spread from the rock and roll of the 1950s and 60s. The Beatles and the Rolling Stones were built on this rhythm.'
        }
    },
    {
        id: 'boombap',
        key: '4',
        bpm: 90,
        name: {ja: 'ブーンバップ', en: 'Boom bap'},
        track: [s('bd'), beat('0,7,10'), also(s('[~ sd]*2')), also(s('hh*8')), bank('RolandTR808')],
        code: 'stack(s("bd").beat("0,7,10", 16), s("[~ sd]*2"), s("hh*8")).bank("RolandTR808")',
        about: {
            ja: 'ゆっくりの ヒップホップ。キックが 拍の 頭から ずれた 場所(7番目、10番目の マス)で 鳴るので、首を ふりたくなる ゆれが 出るよ。',
            en: 'Slow hip hop. The kick plays off the beats (steps 7 and 10), which gives it a nodding groove.'
        },
        tips: {
            ja: [
                'キックの マスを <code>0,3,7,10</code> に して、手数を ふやす',
                'ハイハットに「音の大きさ」<code>[.4 .8]*4</code> を つけて、強弱を つける',
                '11章の シャッフル(<code>[hh ~ hh]*4</code>)に して、はねさせる'
            ],
            en: [
                'Make the kick steps <code>0,3,7,10</code> for more kicks',
                'Add gain <code>[.4 .8]*4</code> to the hats for loud and soft hits',
                'Use the shuffle of step 11 (<code>[hh ~ hh]*4</code>) to make it swing'
            ]
        },
        history: {
            ja: '1980〜90年代の ニューヨークの ヒップホップ。キックの「ブーン」と スネアの「バップ」の 音から 名前が ついた。レコードから ドラムを 切りとって ならべる「サンプリング」で つくられたよ。',
            en: 'Hip hop of New York in the 1980s and 90s. It is named after the sounds of the kick (boom) and the snare (bap). It was made by sampling: cutting drums out of records and putting them in order.'
        }
    },
    {
        id: 'trap',
        key: '5',
        bpm: 140,
        name: {ja: 'トラップ', en: 'Trap'},
        track: [
            s('bd'), beat('0,6,11'), also(s('sd'), beat('8')),
            also(s('hh*8'), ['every', {CYCLES: 2, TRANSFORM: 'ply'}]), bank('RolandTR808')
        ],
        code: 'stack(s("bd").beat("0,6,11", 16), s("sd").beat("8", 16), s("hh*8").every(2, x => x.ply(2)))' +
            '.bank("RolandTR808")',
        about: {
            ja: 'スネアが 3拍目に 1回だけ 鳴るので、BPM 140 でも ゆったり 聞こえる(ハーフタイム)。2サイクルに 1回、ハイハットが 2倍に こまかく なって、チキチキ 連打 するよ。',
            en: 'The snare plays only once, on beat 3, so it sounds slow even at 140 BPM (half time). Every two cycles the hats get twice as fast and roll.'
        },
        tips: {
            ja: [
                'ハイハットの「サイクルごとに変える」を 4 に して、連打を へらす',
                'キックに「再生の速さ」<code>.8</code> を つけて、低く する',
                'マスターレベルの「ときどき変える」で、連打を ランダムに する'
            ],
            en: [
                'Set every of the hats to 4 for fewer rolls',
                'Add speed <code>.8</code> to the kick to make it lower',
                'Use sometimes (master level) to make the rolls random'
            ]
        },
        history: {
            ja: '2000年代の アメリカ南部、アトランタの ヒップホップから 生まれた。ローランドの TR-808 の 長く のびる キックと、ハイハットの 連打が 目じるし だよ。',
            en: 'Born from the hip hop of Atlanta in the southern US in the 2000s. The long boom of the Roland TR-808 kick and the rolling hats are its marks.'
        }
    },
    {
        id: 'garage',
        key: '6',
        bpm: 132,
        name: {ja: 'UKガラージ', en: 'UK garage'},
        track: [s('bd'), beat('0,10'), also(s('[~ sd]*2')), also(s('[~ hh]*4')), bank('RolandTR909')],
        code: 'stack(s("bd").beat("0,10", 16), s("[~ sd]*2"), s("[~ hh]*4")).bank("RolandTR909")',
        about: {
            ja: '4つ打ちから キックを ぬいて、1拍目と 3拍目の 少し あと(10番目の マス)だけに した。キックが「ドン……ドン」と 2歩で 歩くので「2ステップ」とも よぶよ。',
            en: 'The kicks of four on the floor are taken out, except beat 1 and a bit after beat 3 (step 10). The kick walks in two steps, so it is also called 2-step.'
        },
        tips: {
            ja: [
                'キックの マスを <code>0,10,11</code> に して、つまずかせる',
                'ハイハットの 上に <code>hh*16</code> を「音の大きさ」<code>.3</code> で 重ねる',
                'BPM を 172 に 上げて、つぎの ドラムンベースと くらべる'
            ],
            en: [
                'Make the kick steps <code>0,10,11</code> so that it stumbles',
                'Stack <code>hh*16</code> with gain <code>.3</code> on the hats',
                'Raise the BPM to 172 and compare it with drum and bass, the next rhythm'
            ]
        },
        history: {
            ja: '1990年代 後半の イギリス・ロンドンで 生まれた。アメリカの ガラージ・ハウスを イギリス風に くずした もので、のちの ダブステップや グライムの もとに なったよ。',
            en: 'Born in London in the late 1990s. It broke up American garage house in a British way, and led to dubstep and grime.'
        }
    },
    {
        id: 'dnb',
        key: '7',
        bpm: 172,
        name: {ja: 'ドラムンベース', en: 'Drum and bass'},
        track: [s('bd'), beat('0,10'), also(s('[~ sd]*2')), also(s('hh*8')), bank('RolandTR909')],
        code: 'stack(s("bd").beat("0,10", 16), s("[~ sd]*2"), s("hh*8")).bank("RolandTR909")',
        about: {
            ja: 'BPM 170 くらいの とても 速い リズム。キックと スネアの ならびは UKガラージと 同じ「2ステップ」。速さを かえるだけで、ちがう ジャンルに なるんだ。',
            en: 'A very fast rhythm of about 170 BPM. The kick and the snare are the same 2-step as UK garage: only the speed makes it another genre.'
        },
        tips: {
            ja: [
                'ハイハットに「サイクルごとに変える」<code>4</code>「くりかえし」を つけて、4サイクルに 1回 こまかく する',
                'キックの マスを <code>0,10,11</code> に する',
                'スネアの 上に <code>sd</code> を マス <code>7,15</code>、「音の大きさ」<code>.2</code> で 重ねて、ゴーストノートを 入れる'
            ],
            en: [
                'Add every <code>4</code> <code>ply 2</code> to the hats to make them faster once in four cycles',
                'Make the kick steps <code>0,10,11</code>',
                'Stack <code>sd</code> on steps <code>7,15</code> with gain <code>.2</code> on the snare for ghost notes'
            ]
        },
        history: {
            ja: '1990年代の イギリスで、ジャングルという 音楽から 生まれた。むかしの ソウルの レコードの ドラム(とくに「アーメン・ブレイク」)を 速く して 切りきざんだ のが はじまり だよ。',
            en: 'Born from jungle music in Britain in the 1990s. It started with drums from old soul records (especially the Amen break), played fast and cut up.'
        }
    },
    {
        id: 'reggaeton',
        key: '8',
        bpm: 95,
        name: {ja: 'レゲトン', en: 'Reggaeton'},
        track: [s('bd*4'), also(s('sd'), beat('3,6,11,14')), also(s('hh*8')), bank('RolandTR808')],
        code: 'stack(s("bd*4"), s("sd").beat("3,6,11,14", 16), s("hh*8")).bank("RolandTR808")',
        about: {
            ja: '4つ打ちの キックに、スネアが 3番目と 6番目、11番目と 14番目の マスで 鳴る。半小節(8マス)を 見ると、キックの 0 から 3マス、3マス、2マスで 区切れる「3・3・2」の ズレ。これが ラテンの ノリ だよ。',
            en: 'Over four-on-the-floor kicks, the snare plays on steps 3 and 6, and 11 and 14. In each half bar (8 steps), the kick on 0 and the snares cut it into 3, 3 and 2 steps. This offset is the Latin groove.'
        },
        tips: {
            ja: [
                'スネアを <code>rim</code> に かえて、軽く する',
                'スネアの マスを <code>3,6,11,13,14</code> に して、手数を ふやす',
                'キックを ぬいて、スネアだけで 3・3・2 の ズレを 聞いてみる'
            ],
            en: [
                'Change the snare to <code>rim</code> for a lighter sound',
                'Make the snare steps <code>3,6,11,13,14</code> for more hits',
                'Take out the kick and hear the 3-3-2 offset of the snare alone'
            ]
        },
        history: {
            ja: '1990年代の プエルトリコで 生まれた。ジャマイカの ダンスホールの 曲「Dem Bow」の リズムが もとに なっていて、この リズムは「デンボウ」と よばれる。半小節を 3・3・2 に 区切る ズレは、キューバの「トレシージョ」という 古い リズムと 同じ だよ。',
            en: 'Born in Puerto Rico in the 1990s. Its rhythm, called dembow, comes from the Jamaican dancehall song "Dem Bow". Cutting a half bar into 3, 3 and 2 is the same as tresillo, an old Cuban rhythm.'
        }
    }
];

/** Base tracks of the techniques: house on separate tracks, so that a technique can change one of them. */
export const BASE = [
    {name: 'キック', track: [s('bd*4'), bank('RolandTR909')]},
    {name: 'ハイハット', track: [s('[~ oh]*4'), bank('RolandTR909')]},
    {name: 'クラップ', track: [s('[~ cp]*2'), bank('RolandTR909')]}
];

export const TECHNIQUES = [
    {
        id: 'gain',
        key: '1',
        level: 2,
        name: {ja: '強弱を つける', en: 'Loud and soft'},
        trackName: 'きざみ',
        track: [s('hh*16'), ['effect', {EFFECT: 'gain', VALUE: '[.2 .6]*8'}], bank('RolandTR909')],
        code: 's("hh*16").gain("[.2 .6]*8").bank("RolandTR909")',
        about: {
            ja: '「音の大きさ」に パターンを 書くと、1つずつ 大きさが かわる。全部 同じ 大きさだと 機械っぽい けれど、小さい 音と 大きい 音を 交互に すると、人が たたいている ように 聞こえるよ。',
            en: 'A pattern in gain changes the loudness of each sound. All at the same loudness sounds like a machine; soft and loud in turns sounds like a person playing.'
        },
        tips: {
            ja: ['<code>[.2 .6]*8</code> を <code>[.2 .2 .6 .2]*4</code> に して、強い 音を へらす'],
            en: ['Change <code>[.2 .6]*8</code> to <code>[.2 .2 .6 .2]*4</code> for fewer loud hits']
        }
    },
    {
        id: 'offbeat',
        key: '2',
        level: 2,
        name: {ja: '裏打ちの ベース', en: 'Off-beat bass'},
        trackName: 'ベース',
        track: [['note', {CODE: '[~ c2]*4'}], s('sawtooth'), ['effect', {EFFECT: 'lpf', VALUE: '600'}]],
        code: 'note("[~ c2]*4").s("sawtooth").lpf(600)',
        about: {
            ja: 'キックが 拍の 頭(表)で 鳴るので、ベースは その あいだ(裏)に 置く。低い 音どうしが ぶつからないので、どちらも はっきり 聞こえるよ。',
            en: 'The kick plays on the beats, so the bass goes between them, on the off-beats. The low sounds do not clash, and both are clear.'
        },
        tips: {
            ja: ['<code>[~ c2]*4</code> を <code>&lt;[~ c2]*4 [~ g1]*4&gt;</code> に して、サイクルごとに 音を かえる'],
            en: ['Change <code>[~ c2]*4</code> to <code>&lt;[~ c2]*4 [~ g1]*4&gt;</code> to change the note every cycle']
        }
    },
    {
        id: 'ghost',
        key: '3',
        level: 2,
        name: {ja: 'ゴーストノート', en: 'Ghost notes'},
        trackName: 'スネア',
        track: [
            s('[~ sd]*2'),
            also(s('sd'), beat('7,9,14'), ['effect', {EFFECT: 'gain', VALUE: '.2'}]),
            bank('RolandTR909')
        ],
        code: 'stack(s("[~ sd]*2"), s("sd").beat("7,9,14", 16).gain(".2")).bank("RolandTR909")',
        about: {
            ja: 'ふつうの スネアの あいだに、とても 小さい スネアを かくして 入れる。はっきりとは 聞こえない けれど、リズムに こまかい ゆれが 出るよ。おばけ(ゴースト)の ように かくれた 音、という 意味。',
            en: 'Very soft snares hide between the usual snares. You hardly hear them, but they add a small swing to the rhythm. They are hidden like ghosts.'
        },
        tips: {
            ja: ['ゴーストの「音の大きさ」を <code>.5</code> に して、ちがいを 聞く'],
            en: ['Set the gain of the ghosts to <code>.5</code> and hear the difference']
        }
    },
    {
        id: 'euclid',
        key: '4',
        level: 3,
        name: {ja: 'ユークリッドで ずらす', en: 'Offset with euclid'},
        trackName: 'リム',
        track: [s('rim'), ['euclid', {PULSES: 3, STEPS: 8}], bank('RolandTR909')],
        code: 's("rim").euclid(3, 8).bank("RolandTR909")',
        about: {
            ja: '8つの マスに 3つの 音を できるだけ 均等に ならべると、3・3・2 の ズレた リズムに なる。4つ打ちの 上に 重ねると、まっすぐな リズムに ひっかかりが 出るよ。',
            en: 'Three sounds spread as evenly as possible on eight steps make an offset rhythm of 3, 3, 2. Stacked on four on the floor, it adds a catch to the straight rhythm.'
        },
        tips: {
            ja: ['<code>3</code> <code>8</code> を <code>5</code> <code>8</code> や <code>7</code> <code>16</code> に かえる'],
            en: ['Change <code>3</code> <code>8</code> to <code>5</code> <code>8</code> or <code>7</code> <code>16</code>']
        }
    },
    {
        id: 'fill',
        key: '5',
        level: 2,
        name: {ja: 'フィル', en: 'Fills'},
        trackName: 'クラップ',
        track: [s('[~ cp]*2'), ['every', {CYCLES: 4, TRANSFORM: 'ply'}], bank('RolandTR909')],
        code: 's("[~ cp]*2").every(4, x => x.ply(2)).bank("RolandTR909")',
        about: {
            ja: '4サイクルに 1回だけ、クラップを 2回ずつ 鳴らす。ずっと 同じ だと 耳が あきるので、ときどき かわる 場所を 作ると「ここで 区切り」と わかるよ。',
            en: 'Once in four cycles, each clap plays twice. The ear gets bored when nothing changes; a change now and then marks a section.'
        },
        tips: {
            ja: ['「くりかえし」を「はやく」や「ぎゃく」に かえる'],
            en: ['Change "ply 2" to "fast 2" or "rev"']
        }
    },
    {
        id: 'filter',
        key: '6',
        level: 3,
        name: {ja: 'フィルターを ゆっくり 開く', en: 'Open the filter slowly'},
        trackName: 'ベース',
        track: [
            ['note', {CODE: '[~ c2]*4'}], s('sawtooth'),
            ['effect', {EFFECT: 'lpf', VALUE: {wave: ['sine', 200, 3000, 8]}}]
        ],
        code: 'note("[~ c2]*4").s("sawtooth").lpf(sine.range(200, 3000).slow(8))',
        about: {
            ja: '「ひくい音だけ通す」の 値に「ゆれる値」を 入れると、こもった 音から 明るい 音へ、8サイクル かけて ゆっくり かわる。同じ ループでも、音が 動くと もりあがって 聞こえるよ。',
            en: 'A wave in lpf changes the sound from dull to bright and back over eight cycles. The same loop sounds exciting when the sound moves.'
        },
        tips: {
            ja: ['「ゆれる値」の 形を「のこぎりの波」に して、だんだん 明るく なって ストンと もどる ように する'],
            en: ['Change the shape of the wave to <code>saw</code>, which gets brighter and then drops back']
        }
    },
    {
        id: 'random',
        key: '7',
        level: 3,
        name: {ja: 'ランダムに ぬく', en: 'Drop at random'},
        trackName: 'きざみ',
        track: [
            s('hh*16'), ['degradeBy', {PERCENT: 30}], ['effect', {EFFECT: 'gain', VALUE: '.5'}],
            bank('RolandTR909')
        ],
        code: 's("hh*16").degradeBy(0.3).gain(".5").bank("RolandTR909")',
        about: {
            ja: '16分の ハイハットの うち、30% を ランダムに ぬく。毎回 少しずつ ちがう ので、ループなのに 生きている ように 聞こえるよ。',
            en: '30% of the sixteenth-note hats are dropped at random. Each cycle is a bit different, so the loop sounds alive.'
        },
        tips: {
            ja: ['30 を 60 に して、すきまを ふやす'],
            en: ['Change 30 to 60 for more gaps']
        }
    }
];

/** Break and drop: stop the kick, then bring it back. */
export const BREAK = {
    breakKey: '8',
    dropKey: '9',
    name: {ja: 'ブレイクと ドロップ', en: 'Break and drop'},
    about: {
        ja: '8 キーで キックを 止めて(ブレイク)、9 キーで もどす(ドロップ)。キックが ない あいだ 耳が キックを 待つので、もどった ときに もりあがる。止める 時間が 長いほど、もどった ときが 気持ちいいよ。',
        en: 'Key 8 stops the kick (break) and key 9 brings it back (drop). While the kick is gone, the ear waits for it, so its return is exciting. The longer the break, the better the drop.'
    },
    tips: {
        ja: ['8 を おしてから 4サイクル 待って 9 を おす。つぎは 8サイクル 待って くらべる'],
        en: ['Press 8, wait four cycles, then press 9. Next, wait eight cycles and compare']
    }
};

/**
 * Steps of a mini-notation which the rhythm book uses: names, ~, [ ] and *N.
 * @param {string} code - mini-notation
 * @returns {Array<[number, string]>} - [step, sound] in a cycle of STEPS steps
 */
export const miniSteps = code => {
    let pos = 0;
    const parseSeq = (start, size, end) => {
        const items = [];
        while (pos < code.length && code[pos] !== end) {
            if (code[pos] === ' ') {
                pos++;
                continue;
            }
            let item;
            if (code[pos] === '[') {
                pos++;
                const inner = [];
                item = {seq: inner};
                const mark = pos;
                // parse later with its size, so remember where it starts
                item.mark = mark;
                let depth = 1;
                while (depth) {
                    if (code[pos] === '[') depth++;
                    if (code[pos] === ']') depth--;
                    pos++;
                }
            } else {
                const name = code.slice(pos).match(/^[^\s[\]*]+/)[0];
                pos += name.length;
                item = {name};
            }
            const times = code.slice(pos).match(/^\*(\d+)/);
            if (times) pos += times[0].length;
            item.times = times ? Number(times[1]) : 1;
            items.push(item);
        }
        const out = [];
        const width = size / items.length;
        items.forEach((item, i) => {
            const part = width / item.times;
            for (let t = 0; t < item.times; t++) {
                const at = start + (i * width) + (t * part);
                if (item.name && item.name !== '~') out.push([at, item.name]);
                if (item.seq) {
                    const keep = pos;
                    pos = item.mark;
                    out.push(...parseSeq(at, part, ']'));
                    pos = keep;
                }
            }
        });
        return out;
    };
    return parseSeq(0, STEPS, undefined);
};

/**
 * Rows of hits by sound, in the order which the sounds first play.
 * @param {Array<[number, string]>} hits - [step, sound]
 * @returns {Array<{sound: string, steps: Array<number>}>} - rows
 */
export const rowsOf = hits => {
    const rows = [];
    hits.forEach(([at, sound]) => {
        let row = rows.find(r => r.sound === sound);
        if (!row) {
            row = {sound, steps: []};
            rows.push(row);
        }
        row.steps.push(at);
    });
    return rows;
};

/**
 * Grid of a rhythm: a row for each sound of each chain of the track.
 * @param {Array} track - blocks of the track
 * @returns {Array<{sound: string, steps: Array<number>}>} - rows from the top
 */
export const gridOf = track => {
    const rowsOfChain = chain => {
        const code = chain.find(([opcode]) => opcode === 's')[1].CODE;
        const beatStep = chain.find(([opcode]) => opcode === 'beat');
        if (beatStep) return [{sound: code, steps: beatStep[1].BEATS.split(',').map(Number)}];
        return rowsOf(miniSteps(code));
    };
    const top = track.filter(([opcode]) => opcode !== 'stackBranch');
    const branches = track.filter(([opcode]) => opcode === 'stackBranch').map(([, , inner]) => inner);
    return [top, ...branches].flatMap(rowsOfChain);
};

/** Japanese and English of the texts in the projects, for words-en.mjs. */
export const RHYTHM_WORDS = {
    'きざみ': 'ticks',
    'クラップ': 'clap',
    'リム': 'rim',
    'もとの リズム': 'base rhythm',
    ...Object.fromEntries(RHYTHMS.map(r => [`${r.key}: ${r.name.ja}(BPM ${r.bpm})`, `${r.key}: ${r.name.en} (BPM ${r.bpm})`])),
    ...Object.fromEntries(TECHNIQUES.map(t => [`${t.key}: ${t.name.ja}`, `${t.key}: ${t.name.en}`])),
    [`${BREAK.breakKey}: ブレイク(キックを 止める)`]: `${BREAK.breakKey}: break (stop the kick)`,
    [`${BREAK.dropKey}: ドロップ(キックを もどす)`]: `${BREAK.dropKey}: drop (bring the kick back)`,
    '1〜8 キーで リズムを かえよう。0 で とめる':
        'Change the rhythm with keys 1-8. 0 stops.',
    '1〜7 キーで テクニックを 足そう。8 で ブレイク、9 で ドロップ、スペースで もとに もどす。0 で とめる':
        'Add techniques with keys 1-7. 8 breaks, 9 drops, space goes back. 0 stops.',
    '定番の リズムを 1〜8 キーで 切りかえるよ。\nリズムは「ドラム」トラック 1本に、楽器ごとに「重ねる」で 入っているよ。\n欄の 文字や マスの 番号を かえて、改造してみよう。':
        'Keys 1-8 switch the standard rhythms.\nEach rhythm is one "drums" track, with a stack for each instrument.\nChange the text and the step numbers to remake them.',
    'ハウスの 4つ打ちに、1〜7 キーで テクニックを 1つずつ 足して、ちがいを 聞きくらべよう。\nスペースで もとの リズムに もどるよ。':
        'Add the techniques one by one with keys 1-7 to the house beat and hear the difference.\nSpace goes back to the base rhythm.'
};
