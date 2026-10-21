# Strudel for Xcratch

[Strudel](https://strudel.cc/) のパターン音楽を、Scratch のブロックで作れる [Xcratch](https://xcratch.github.io/) 拡張機能です。
小学生から使えるように、英語・日本語・ひらがなに対応しています。

Make pattern music like [Strudel](https://strudel.cc/) with Scratch blocks on [Xcratch](https://xcratch.github.io/).
Available in English, Japanese and Japanese (Hiragana).

## デモ / Demo

- https://0x48lab.github.io/xcx-strudel/ — ブラウザですぐ遊べます(緑の旗を押してください)
- [チュートリアル / Tutorial](https://0x48lab.github.io/xcx-strudel/tutorial.html) — スクリーンショット付きで 9 ステップ(日本語)
- サンプル作品(エディタでブロックを見る)
  - [はじめて: ビートと おどる ねこ](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/demo.sb3)
  - [ふつう: おんかいで メロディ](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/melody.sb3) — スペース・↑・↓・R キーでメロディが変わる
  - [マスター: DJ トランス](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/trance.sb3) — 1〜5 キーでパートを重ね、Q〜T で止める
  - [マスター: アシッドとトランスゲート](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/acidgate.sb3) — [Switch Angel](https://github.com/switchangel) さんの [strudel-scripts](https://github.com/switchangel/strudel-scripts) の音作りを参考にした非公式の作品です(本人とは関係ありません)。コードは使わず、アシッドとトランスゲートのブロックで独自に再現しています
- サンプル作品は `npm run demo` で `projects/` に作り直せます

## できること / Features

- ドラム・音・休みを「順番に」「同時に」「交互に」「くりかえす」で組み立てて、トラックごとに鳴らす
- エフェクト(lpf, hpf, room, delay, gain, pan, crush, speed, attack, release, vowel)、変形(rev, ply, every)、音階(scale)
- ミニ記法(`bd*2 [~ sd] <hh oh>`)をそのまま書くこともできる
- スプライトの音(録音した声など)をサンプルとして使う
- オシロスコープとピアノロールをステージに表示する
- 「拍がきたとき」「[バスドラム]が鳴ったとき」でスプライトを音に合わせて動かす
- 値を返すブロックをクリックすると、同じ音を鳴らす Strudel のコードが表示される
- 全部のトラックを Strudel のコードとして書き出したり、strudel.cc で開いたりできる
- ゆれる値(sine など)、ランダム、ユークリッドリズム、左右分け、和音とアルペジオ(マスター)

ブロックは「はじめて」「ふつう」「マスター」のレベルで表示を切り替えられます。

## How to Use in Xcratch

1. Open [Xcratch Editor](https://xcratch.github.io/editor)
2. Click 'Add Extension' button
3. Select 'Extension Loader' extension
4. Type the module URL in the input field

```
https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs
```

## 音源について / Sounds

- 内蔵シンセ(sine, square, sawtooth, triangle)と合成ドラム(bd sd hh oh cp rim lt mt ht cr)は、ネットワークなしで鳴ります。
- 「Strudelの音を読み込む」ブロックを使ったときだけ、次のサンプルを GitHub から読み込みます。読み込み先はこの4つに限られています。
  - [felixroos/dough-samples](https://github.com/felixroos/dough-samples) のサンプルマップ
  - ピアノ: Salamander Grand Piano V3 — Alexander Holm, [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
  - VCSL: [sgossner/VCSL](https://github.com/sgossner/VCSL), CC0
  - ドラムマシン: [ritchse/tidal-drum-machines](https://github.com/ritchse/tidal-drum-machines)
  - Dirt-Samples: [tidalcycles/Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples)

## 安全のために / Safety

共有された作品を開いても任意のコードが実行されないよう、次のようにしています。

- Strudel のコードを実行する(eval する)ブロックはありません。ブロックが作るパターンは、許可した関数だけを呼び出します。
- ミニ記法の掛ける数(`*`, `!`, `/`, ユークリッドリズム)は64まで、テンポは10〜400 BPM に制限しています。
- 外部から読み込めるのは、上の4つのサンプルマップだけです。
- 「strudel.cc で開く」で書き出すコードには、許可した関数名と、エスケープした文字列しか入りません。トラック名はコメントに入れる前に、文字・数字・空白・`_`・`-` 以外を `_` に置き換えます(U+2028 などの改行文字でコメントを抜け出せないように)。

## Development

```sh
npm install
npm run setup-dev   # links scratch-vm sources from ../scratch-editor
npm run build       # dist/strudel.mjs
npm run watch
npm test            # vitest
npm run demo        # projects/*.sb3
npm run tutorial    # projects/tutorial/*.sb3
npm run tutorial:shots  # tutorial/*.png by the Xcratch editor in headless Chromium (npx playwright-core install chromium)
```

The local editor is used for debugging, because a page on `xcratch.github.io` needs the Chrome permission for local network access to load an extension from `localhost`.

```sh
# in ../scratch-editor (certificates in .vscode/ by mkcert)
cd packages/scratch-gui && npm run start   # https://localhost:8601
# in this repository
npx http-server . -p 5500 -S -C <cert.pem> -K <key.pem> --cors
```

## License

[AGPL-3.0](LICENSE), because this extension bundles Strudel (`@strudel/core`, `@strudel/mini`, `@strudel/tonal`, `superdough`), which is licensed under AGPL-3.0.

## 注意 / Notes

- 音の絵(オシロスコープ、ピアノロール)を表示しているあいだは、「色に触れた」の判定に絵の色も含まれます。
