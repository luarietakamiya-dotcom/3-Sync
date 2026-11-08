# live 床の多様化

対象: `feat/live-map-art` の `5c0307b`。元作業ツリーは `feat/alley-map-art` のため変更せず、`/tmp/live-floor-work` の作業用コピーで実装した。main へのマージ・push は行っていない。

## 実装

- 外周112px帯と交差する、従来の y=62 起点112×112セルを舞台化。7枚×16pxの木板、交互の張り方向、指定3色・直線木目・交互の突き付け、四隅2×2固定部を実装。
- 中央は56×56切り石3色、224pxごとに直交する4px割付帯（両脇1px目地）。舞台の前面は受光2px＋蹴込み3px、左右は1px影。判定・移動・deco配置は変更なし。
- electric の x/y/w/h 判定矩形＋16px内では、石と舞台前縁の受光を1px単位で抑制。面・目地は残る。
- `drawLiveFloorStatic` と `drawLiveFloorDynamic` に分離し、BG_ART.live の既存 ART_FX 接続を維持。2%のマゼンタ継ぎ目は舞台だけに描き、既存 teleK・electric減光・近接減光を維持。接地拡散光等の `drawLiveGround` は変更なし。新規アニメーションなし、OFM変更なし。
- alley実装と同じ共有キャッシュの関数・キー形式を導入。256px、zone/seed/hazKey/ART_VER/スケール帯（0.25刻み）＋マップ寸法＋チャンク座標。LRU24・床6MiB・オブジェクト込み16MiB。初回可視範囲を生成、以降2枚/フレーム、未生成や大きすぎるスケールは直接描画。
- ART_VERは1→2。床と独立して、実際の起点コードのdecoキー（live a2 / slum a1）を固定して保持。設計文のslum a2はこのブランチの起点と異なるため、既存キーを優先した。
- 別区画の床を併合する際は同名の共有キャッシュを重複定義せず再利用すること。既存のalleyキー形式は変更していない。

## 成果物

- `sample.html`: 床のみ・1倍/2倍・上端/右下境界/静穏域。グレースケール切替付き。
- `sample.svg` / `sample.png`: 実際の静的Canvas命令をSVG化し、librsvgでラスタ化したサンプル。実ゲームのスクリーンショットではない。
- `index.html`: 完成版ゲームHTML（元のgame/index.htmlに適用する内容。通常のgame配下のassets/data等が必要）。
- `live-floor.patch`: `git am` 用パッチ（指定作者、5c0307bの上）。
- `floor-test.log`: 自動検証結果。

## 検証

実施・合格:
- JS全体の構文検査、描画数値の有限性・矩形寸法検査。
- seed 0〜99、固定hazard入りで起点版とdeco配列のJSON完全一致、同seed再現性、床描画前後で不変。
- 静的層が時刻変更で不変、Math.random不要、electric静穏域（石/舞台境界を含む）の全受光ピクセル検査。
- 2枚/フレームの遅延生成、LRU24・6MiB・共有16MiBの上限、スケール帯と過大スケールの直接描画、hazard寸法による無効化、falling marksによる無用な無効化の防止。
- 1倍の矩形描画命令をラスタ比較し、マップ一括と256px分割の描画結果が一致（舞台縁と帯を含む）。
- サンプルPNGの目視: 木板/広場/縁の区別、固定部が点、直交割付、円・楕円・L字・シアン・金線・暗い嵌め込み板なし。
- git diff --check。

未実施:
- Chromium実画面、hazard表示を重ねたスクリーンショット、実機操作、CPU p95 2ms/フレーム増加10%の測定。
  Chromium起動を試したが、/opt/meta-chromiumではドメインポリシー要求、Playwright側Chromiumでは setsockopt Operation not permitted で起動不可。
- `check-live-variety` は起点ブランチにないため、上記の100seed比較で配置不変を検証した。

再実行（リポジトリルート）:

```sh
git show 5c0307b:game/index.html > /tmp/live-baseline.html
node game/tools/check-live-floor.cjs /tmp/live-baseline.html
node game/tools/live-floor-sample.cjs
python3 game/tools/live-floor-raster.py
# Playwright利用可能な実機で:
node game/tools/live-floor-browser.cjs /path/to/repo/game
```

サンプルラスタ出力時のFontconfigキャッシュ警告は出力成功を妨げなかった。床意匠について設計からの逸脱なし。
