/**
 * English for the Japanese texts of the sample and tutorial projects.
 * Keys are the Japanese texts as they are written in the scripts.
 * Run a generator with --en to write the English projects into en/.
 */
import {RHYTHM_WORDS} from './rhythm-book.mjs';

export const WORDS = {
    ...RHYTHM_WORDS,
    // track, list and message names
    'えんそう': 'play',
    'こえ': 'voice',
    'アシッド': 'acid',
    'キック': 'kick',
    'コード': 'chords',
    'スネア': 'snare',
    'ドラム': 'drums',
    'ハイハット': 'hats',
    'パッド': 'pad',
    'ビルドアップ': 'build-up',
    'フィルター': 'filter',
    '前のフィルター': 'previous filter',
    'ビート': 'beat',
    'ピアノ': 'piano',
    'ピアノのコード': 'piano chords',
    'ピアノのリズム': 'piano rhythm',
    'プラック': 'pluck',
    'ベース': 'bass',
    'メロディ': 'melody',
    'ライザー': 'riser',
    'リズム': 'rhythm',
    'リード': 'lead',

    // what the sprite says
    '1 で 和音、2 で リズムを つけて、3〜5 で パートを ふやそう。0 で とめる':
        'Press 1 for chords, 2 to add a rhythm, and 3-5 to add parts. 0 stops.',
    '1〜4 キーで パートを ひとつずつ とめて、スペースで ぜんぶ もどるよ。':
        'Keys 1-4 stop the parts one by one. Space brings them all back.',
    '1〜4 キーで パートを ふやそう。0 で とめる':
        'Add parts with keys 1-4. 0 stops.',
    '1〜5 キーで パートを ふやそう。Q〜T で とめる、0 で ぜんぶ とめるよ。':
        'Add parts with keys 1-5. Q-T stop them, 0 stops everything.',
    '1〜6 キーで パートを ふやそう。7 で ポンピング、1 で もとの キック。スペースで ドロップ、0 で とめる':
        'Add parts with keys 1-6. 7 pumps, 1 is the plain kick. Space drops, 0 stops.',
    '「音」タブで 声を 録音して、▼ で えらんでね。1〜4 キーで ためそう、0 で とめる':
        'Record your voice in the Sounds tab and choose it with ▼. Try keys 1-4, 0 stops.',
    'スペース・↑・↓ キーで メロディが かわるよ。R キーで ひびきが つくよ。':
        'Space, up and down change the melody. R adds reverb.',
    'スライダーで ベースの フィルターを うごかそう。':
        'Move the filter of the bass with the slider.',

    // comments
    ['シンセキックで ほかの トラックを へこませる(ダッキング)アシッド。\nベースは マイナースケールの らんすうの おとを、' +
        'えらびかた 46 で くりかえすよ。\nSwitch Angel さんの ライブコーディングを さんこうにした、ひこうしきの さくひんです' +
        '(ほんにんとは かんけいありません)。']:
        'Acid where the synth kick pushes the other tracks down (ducking).\n' +
        'The bass repeats random notes of a minor scale, picked by number 46.\n' +
        'An unofficial work inspired by the live coding of Switch Angel (not related to Switch Angel).',
    ['スライダーが うごいたかを しらべるよ。\n「前のフィルター」は、まえに しらべた ときの「フィルター」の メモ。\n' +
        'メモと ちがったら、メモを なおして ベースを ならしなおすよ。']:
        'This checks if the slider has moved.\n"previous filter" is a note of "filter" from the last check.\n' +
        'When they are different, it updates the note and plays the bass again.',
    'らんすうを スケールの ばんごうに すると、\nいつも スケールの なかの おとに なるよ。':
        'Random numbers as steps of a scale\nalways make notes in the scale.',
    'みどりの はたを おすと、ドラムと メロディが なるよ。\n「seq」の ▼ で おとを かえてみよう。':
        'Click the green flag to play the drums and the melody.\nChange the sounds with ▼ of "seq".',
    'はくが くるたびに コスチュームを かえて おどるよ。':
        'The cat dances by changing its costume on every beat.',
    'バスドラムが なると すこし おおきくなるよ。':
        'The cat grows a little on each bass drum.',
    'おんかい(ヨナぬき)の ばんごうで メロディを つくるよ。\nピアノの おとは じどうで よみこまれるよ。':
        'The melody is made of step numbers of a pentatonic scale.\nPiano sounds are loaded automatically.',
    'キーを おすと、つぎの サイクルの はじめで メロディが いれかわるよ。':
        'A key changes the melody at the start of the next cycle.',
    'キーで パートを かさねていく DJ あそび。\nアシッドベースと トランスゲートの パッドを つかっているよ。':
        'Play DJ by adding parts with keys.\nIt uses an acid bass and a pad with a trance gate.',
    'アシッドと トランスゲートの きょく。\nSwitch Angel さんの strudel-scripts の おとづくりを さんこうにした、ひこうしきの さくひんです(ほんにんとは かんけいありません)。':
        'A song with acid and a trance gate.\nAn unofficial work inspired by the sounds of strudel-scripts by Switch Angel ' +
        '(not related to Switch Angel).',
    'ジャズや ソウルの 和音を つかった ピアノ ポップ。\n| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |':
        'Piano pop with chords of jazz and soul.\n| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |',
    ['ジャズや ソウルの 和音を つかった ピアノ ポップ。\n| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |\n' +
        'ベースが 根音(ルート)を ひくので、ピアノは 根音を はぶいた 和音を ひいているよ。\n1拍を 3つに わけた「シャッフル」の リズムで はねているよ。\n' +
        '和音・ベース・メロディは「変数」の リストに 1小節ずつ、\nピアノの リズムは 1拍ずつ、ドラムは 楽器ごとに 1行ずつ 入っているよ。']:
        'Piano pop with chords of jazz and soul.\n| FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 |\n| FM7 | Fm6 | Em7 E♭dim7 | Dm7 G7sus4 |\n' +
        'The bass plays the roots, so the piano leaves them out.\nIt bounces in a shuffle: a beat is cut into three.\n' +
        'Chords, bass and melody are in the lists of Variables, a bar in each item.\n' +
        'The piano rhythm has a beat in each item, and the drums a drum in each item.',
    '和音・ベース・メロディは「変数」の リストに 1小節ずつ 入っているよ。\nステージの リストを クリックすると、和音を 書きかえられるよ。':
        'Chords, bass and melody are in the lists of Variables, a bar in each item.\nClick the list on the stage to change the chords.',
    'さいしょは ねこの「Meow」が 入っているよ。\n「音」タブで 録音した 声を、「スプライトの音」の ▼ で えらぶと、じぶんの 声で 鳴るよ。':
        'The cat\'s "Meow" is here at first.\nRecord your voice in the Sounds tab and choose it with ▼ of "sprite sound" to play your voice.',
    'EDM・トランスの 音づくり。\nキーを 1つずつ おして、パートの やくわりを 耳で たしかめよう。\n和音・ベース・リード・ビルドアップは リストに 1小節ずつ 入っているよ。':
        'Sounds of EDM and trance.\nPress the keys one by one and listen to what each part does.\n' +
        'Chords, bass, lead and the build-up are in lists, a bar in each item.'
};
