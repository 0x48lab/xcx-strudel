# Strudel for Xcratch

[Strudel](https://strudel.cc/) のパターン音楽を、Scratch のブロックで作れる [Xcratch](https://xcratch.github.io/) 拡張機能です。
小学生から使えるように、英語・日本語・ひらがなに対応しています。

Make pattern music like [Strudel](https://strudel.cc/) with Scratch blocks on [Xcratch](https://xcratch.github.io/).
Available in English, Japanese and Japanese (Hiragana).

## デモ / Demo

- https://0x48lab.github.io/xcx-strudel/ — ブラウザですぐ遊べます(緑の旗を押してください)
- English: https://0x48lab.github.io/xcx-strudel/en/ (tutorial: https://0x48lab.github.io/xcx-strudel/en/tutorial.html)
- [新規プロジェクト / New project](https://xcratch.github.io/editor/?extension=https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs) — 拡張機能が入った状態で Xcratch エディターが開きます
- [チュートリアル / Tutorial](https://0x48lab.github.io/xcx-strudel/tutorial.html) — スクリーンショット付きの 13 ステップ。リストとリズムで曲を書く、自分の声をビートにする、EDM・トランスの音作り、ジャズ・ソウルの和音まで(日本語)
- サンプル作品(エディタでブロックを見る)
  - [ビギナー: ビートと おどる ねこ](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/demo.sb3)
  - [ノーマル: おんかいで メロディ](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/melody.sb3) — スペース・↑・↓・R キーでメロディが変わる
  - [ノーマル: ソウルな ピアノ ポップ](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/soulpop.sb3) — ジャズ・ソウル系の和音(セブンス、ナインス、借用和音、経過ディミニッシュ)とシャッフルのリズムで作ったオリジナル曲。和音・ベース・メロディはリストに1小節ずつ、ピアノのリズムは1拍ずつ、ドラムは楽器ごとに1行ずつ入っている。1〜4 キーでパートを止め、スペースで戻す
  - [マスター: DJ トランス](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/trance.sb3) — 1〜5 キーでパートを重ね、Q〜T で止める
  - [マスター: アシッドとトランスゲート](https://xcratch.github.io/editor/#https://0x48lab.github.io/xcx-strudel/projects/acidgate.sb3) — [Switch Angel](https://github.com/switchangel) さんの [strudel-scripts](https://github.com/switchangel/strudel-scripts) の音作りを参考にした非公式の作品です(本人とは関係ありません)。コードは使わず、`acidenv` と `trancegate` のブロックで再現しています
- サンプル作品は `npm run demo` で `projects/` に作り直せます

## できること / Features

- C型の「トラック [ ] で鳴らす」ブロックが Strudel の1行(1トラック)。中に積んだブロックを上から順に読むと、そのまま Strudel のメソッドチェーンになる(`s [hh]` の下に `fast [8]` → `s("hh").fast(8)`)
- ブロックの形ごとに役割が1つ: C型 = トラック、中に積む命令ブロック = 音源と変形・効果、丸いブロック = 値(リストの中身、ゆれる値、乱数)
- ブロックとメニューには Strudel の関数名・音の名前をそのまま使う(`seq` `stack` `cat` `fast` `lpf` `bd` など)。Strudel に名前がない Scratch 側の操作(トラックで鳴らす、止める など)だけ日本語
- ビギナーでは `s [bd ▼]` `note [c4 ▼]` `seq` `stack` `cat` の ▼ で音を選び、`fast` で速くする。ノーマルからは `s [ ]` `note [ ]` にミニ記法を書ける
- エフェクト(lpf, hpf, room, delay, gain, pan, crush, speed, attack, release, distort, fm, vowel など)、変形(rev, ply, every)、音階(n + scale)
- ミニ記法(`bd*2 [~ sd] <hh oh>`)をそのまま書くこともできる
- Scratch のリストの中身を、1サイクルずつ・順番に・同時に並べてミニ記法にできる(長いコード進行やメロディを1小節ずつ書ける)
- `struct` ブロックで、和音などを `x ~` のリズムで鳴らせる。`beat` ブロックで、16マスなどの何番目で鳴らすかを番号で書ける(`beat [0,7?,10] [16]`)
- トラックの中の C型「stack で重ねる」で、中に積んだブロックを別の鎖として同時に鳴らせる(Strudel の `stack(a, b)` と同じ形になる)
- スプライトの音(録音した声など)をサンプルとして使う
- オシロスコープとピアノロールをステージに表示する
- 「拍がきたとき」「[bd]が鳴ったとき」でスプライトを音に合わせて動かす
- 全部のトラックを Strudel のコードとして書き出したり、strudel.cc で開いたりできる
- 信号(sine など)、乱数(irand)、degradeBy、euclid、jux、sometimes、off、superimpose、和音と arp(マスター)
- `acidenv` と `trancegate`([Switch Angel](https://github.com/switchangel) さんの [strudel-scripts](https://github.com/switchangel/strudel-scripts) の関数が元)、`duck` / `orbit` によるポンピング(サイドチェイン)、ノイズ、supersaw の厚み(unison / detune / spread)(マスター)

ブロックは「ビギナー」「ノーマル」「マスター」のレベルで表示を切り替えられます。

### v0.4.0 の非互換 / Breaking change in v0.4.0

v0.4.0 でブロックを作り直しました。丸いブロックを入れ子にする形(「〜をトラック〜で鳴らす」、`fast [ ] [音]` など)をやめて、C型の「トラック [ ] で鳴らす」の中にブロックを積む形にしました。古いブロックは削除したため、**v0.3.0 までに保存した作品は、開いてもスクリプトが表示されず、音も鳴りません**。新しいブロックで組み直してください。

v0.4.0 replaces the nested round blocks ("play [ ] on track [ ]", `fast [ ] [pattern]` and others) with the C block "play on track [ ]" and blocks stacked in it. The old blocks are removed, so **projects saved with v0.3.0 or earlier open without their scripts and play nothing**. Build them again with the new blocks.

## How to Use in Xcratch

1. Open [Xcratch Editor](https://xcratch.github.io/editor)
2. Click 'Add Extension' button
3. Select 'Extension Loader' extension
4. Type the module URL in the input field

```
https://0x48lab.github.io/xcx-strudel/dist/strudel.mjs
```

## 音源について / Sounds

- ドラム(bd sd hh oh cp rim lt mt ht cr)は、ネットワークなしで鳴る合成ドラムです。
- 「ドラムの音を [uzu-drumkit (録音)] にする」ブロックを置くと、strudel.cc と同じ [tidalcycles/uzu-drumkit](https://github.com/tidalcycles/uzu-drumkit)(Unlicense)の録音を GitHub から読み込んで鳴らします。`bd:1` のような番号で録音を選べ、rd cb sh tb brk misc も鳴ります。読み込めないときは合成ドラムが鳴ります。
- 内蔵シンセ(sine, square, sawtooth, triangle など)は、ネットワークなしで鳴ります。
- ピアノやドラムマシンなどは、使われている音に合わせて次のサンプルを GitHub から読み込みます。読み込み先はここに挙げたものに限られています。
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
npm run demo        # projects/*.sb3 and projects/en/*.sb3 (English)
npm run tutorial    # projects/tutorial/*.sb3 and projects/tutorial/en/*.sb3
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
