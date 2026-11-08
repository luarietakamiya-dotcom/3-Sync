# slum 床の多様化

基準: feat/slum-map-art / a152c8e。main へのマージは行っていない。

通路144pxを96×48段ずらしのコンクリ版にし、11%の伸縮目地を維持、点検プレートと旧排水スリットを撤去した。両側に縁石4px、排水溝6px、192〜288px間隔の角格子24×12、48×24の湿った切り石を配置。苔は目地線と3×2のT字交点だけで、既存decoのmycel/garden/pipe基準点72px以内で密度を上げる。床用に乱数状態を進めず、既存decoキャッシュの座標を読む。

BG_ART.slum.floorに材質・通路・縁石・溝・動きの設定を追加し、drawArtFloorStatic / drawArtFloorDynamic に分離。静的層はlive床と同じ256×256チャンク方式。キーはslum + seed + hazard形状 + ART_VER + map寸法 + 0.25刻みのスケール帯 + chunk座標。ART_VER=2、decoNowのslum a2キーと配置生成処理は変更なし。他区画の床・deco・OFM・雨・跳ね・反射・霧のコードは変更なし。

LRU最大24、床6MiB、オブジェクト込み16MiB。初回は可視分、以後G.tごとに最大2チャンク生成。未生成・過大スケールは直接描画。オブジェクトキャッシュ側にも床分の使用量を合算。発光継ぎ目と溝の光沢はキャッシュ外、teleKとプレイヤー距離で減光。光沢片は160px間隔、+16px/秒、最大6片。puddle判定楕円の各半径+16pxでは、苔・コテ目・路肩光沢・コンクリ受光線・縁石天端・動的光を省く。

## 成果物

- index.html: 完成ゲームHTML（slumブランチ基準）。既存game/index.htmlへ配置し、元のgame内の画像・JSON等と一緒に使用。
- sample.html / sample.svg / sample.png: 床のみ、通常倍率・2倍・静穏域。実際の描画関数のCanvas命令をSVGへ記録し、librsvgでPNG化した資料。ブラウザーのスクリーンショットではない。
- slum-floor.patch: a152c8eの上へ適用するformat-patch。成果物のindex.htmlとパッチは同じ変更を表すため、適用はパッチを使う。
- floor-test.log / variety-test.log / browser-test.log: 検証記録。

## 検証

通常倍率と2倍のsample.pngを目視確認。コンクリ・両側溝・角格子・湿った路肩・線の苔を確認。床に円/楕円、丸蓋、黄緑、装飾水面、L字印、明るい閉じた矩形枠、苔の面塗りなし。

check-slum-floor.cjsで100 seedの基準HTMLとのdeco JSON完全一致、再現性、床描画前後のdeco不変、静的時間不変、静穏域、有限・非負描画引数、LRU/メモリ/遅延生成、スケール超過時の直接描画、hazard寸法によるキー更新を検査。静的層の全体描画と分割描画を1xラスタで比較。動的層は200時点で光沢片6以下、16px/秒、teleK、プレイヤー付近での半減、puddle内の消灯を検査。既存check-slum-variety.cjsも実行。

ブラウザー起動は `Hatch WebGL domain policy is required for browser startup` により環境側で停止。実機ゲーム操作、実機スクリーンショット、hazard全周の実機視認性、CPU p95 2ms以内とフレーム増加10%以内は未検証。連絡係長による確認が必要。5区画並列の比較は今回のslum単独範囲では未実施。設計値の意図的変更なし。

## 再検証

```
node game/tools/check-slum-floor.cjs /path/to/a152c8e-game-index.html
node game/tools/check-slum-variety.cjs
node game/tools/slum-floor-sample.cjs
python3 game/tools/slum-floor-raster.py
NODE_PATH=/path/to/node_modules node game/tools/slum-floor-browser.cjs /path/to/original/game
```

元リポジトリの.gitは書き込み不可のため /tmp/slum-floor-work に共有オブジェクトの作業コピーを作成し、feat/slum-map-artへ指定作者でコミット。push先は元の読み取り専用リポジトリなのでpushは行わず、パッチを引き渡す。
