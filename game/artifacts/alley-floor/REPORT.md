# alley 床多様化

対象: feat/alley-map-art、親コミット 0ab13aa。元リポジトリは別区画の作業中かつ .git 読み取り専用のため、/tmp/alley-floor-work の共有オブジェクト参照コピーで実装。main にはマージしない。

## 実装

- seed で上下する幅120pxの参道。32×24 の小割り4行、96×24 の延段を中央1行。小割りは16pxずらし、指定3色・2px目地・下面面取り・指定上限の受光色。
- 両側に花崗岩の縁石4px（天端2px/立面2px）、側溝4pxと静的な暗いアンバーの反射1px。
- 店先に128×24のセラミック帯と従来色を残し、発光継ぎ目を店先だけ2%へ。排水スリットを撤去。新規アニメーションは追加せず、既存の雨・反射を維持。
- drawDive の生成済み deco を床に渡し、灯籠/狐の座標を読み取る。参道方向40px以内に18〜26pxの不定形5〜6角形を3〜5枚。灯籠の80px以内の狐は灯籠の組を共有して重複を避ける。単体サンプル描画だけは同じ決定的生成関数でdecoを補う。
- drawAlleyFloorStatic / Dynamic に分離。BG_ART.alley.floor に材質・縁石・側溝を追加し既存ART_FXから接続。
- border床と同じ256×256論理px方式。キーは区画＋seed＋hazKey＋固定hazard形状＋ART_VER＋世界寸法＋0.25刻みスケール帯＋チャンク座標。ART_VER=2、decoの既存キーは固定して変更しない。
- LRU24チャンク、床6MiB、既存オブジェクトキャッシュと合算16MiB。開始時は可視分を生成、その後はG.tのフレームごと最大2。未生成/過大スケールは直接描画。既存オブジェクト側の追い出しも床容量を合算。fallingのmarks/timerは床の追加キーに含めない。
- puddle/electric/noise/rift 周辺は受光を抑制。楕円判定＋16pxを確実に覆うため、静穏域の楕円軸には16√2+1pxを追加する保守的な判定を使用（境界より少し広く消灯）。electricは矩形＋17px。面と目地は残す。
- OFM、配置生成、他区画の描画には変更を加えない。

## サンプル

sample.html / sample.png / sample.svg。通常倍率、灯籠/狐の飛び石、固定hazardの静穏域（床のみ）、2倍詳細。実際の静的描画呼び出しをSVGに記録し、librsvg/CairoでPNG化。SVG版は各パネルのviewportで切り抜く。ブラウザのスクリーンショットではない。

目視: 石畳4行＋中央延段1行、店先帯との切り替わり、縁石・側溝、角形飛び石を確認。床に円/楕円/弧状配列、赤/コーラル、閉じた発光枠、L字角印、マンホール、スリットなし。既存の店先帯の色は指定どおり維持。

## 検証

- check-alley-floor.cjs: HTML内JS構文、100 seedの再現性・改修前decoとの完全一致、床描画によるdeco変更なし、25 seedの静的描画の時間不変性、4種の固定hazard静穏域、有限かつ非負の描画寸法、飛び石の枚数/頂点数/40px範囲、通常時2チャンク/フレーム、24チャンク/6MiB/合算16MiB、スケール超過時の直接描画、hazard寸法変更のキー更新、falling marks非依存を検証。floor-test.log参照。
- 既存check-alley-variety.cjs: 40 seed、配置密度/入口、9種オブジェクト、描画引数、共有キャッシュ、動的層制限を通過。variety-test.log参照。
- git diff --check通過。

再実行（alleyブランチへ適用後）:

```sh
git show 0ab13aa:game/index.html > /tmp/alley-before.html
node game/tools/check-alley-floor.cjs /tmp/alley-before.html
node game/tools/check-alley-variety.cjs
node game/tools/alley-floor-sample.cjs
python3 game/tools/alley-floor-raster.py
```

未実施: 実ブラウザ/実機のゲームプレイ、各hazardを通路/材質境界/飛び石付近に重ねたスクリーンショット、5区画のグレースケール比較、CPU p95≤2ms/フレーム増加≤10%の実測。環境にChromium/Playwrightが見つからず、連絡係長へ引き継ぐ。静的テストは性能目標の実測を代替しない。

## 取り込み

0001-alley-floor.patch を 0ab13aa の alley ブランチに git am で適用する。別区画ブランチへは直接適用しない（共通キャッシュは統合時に一本化）。完成 index.html はレビュー/置換用。HTML以外の画像・音声・data等は既存gameディレクトリと併用する。
