# slum 種類の多様化

対象ブランチ: feat/slum-map-art。main へのマージ・公開適用なし。
元ブランチの game/index.html から実装し、作業中の live ブランチは変更していない。
設計原文は指定 .md が存在しなかったため、同じ briefs ディレクトリの
2026-11-08-map-variety-proposal-claude-raw.txt（§0・§1・§6）を使用。

## 変更
- slum_power → slum_mycel: 30×36、fd12、wt12、near shack/pipe、黄緑 light/lw=190,230,140/14。白い菌糸網・丸傘6本3群、6秒70〜100%。
- slum_terminal → slum_shrine: 30×40、fd12、wt8、edge/max1、暖色 light/lw=216,174,114/14。規格ロッカー・板金屋根・白布・小石・供物瓶、左右LEDは5秒85〜100%。
- slum_container → slum_garden: 40×34、fd16、wt12、max2。金属ラック2段・整列した葉物・暖白育成灯、静的。
- 旧3種の描画・ロスター・端末専用判定を削除。pipe の近傍参照だけ新IDへ更新。
- 残る6種の描画は元ブランチとバイト単位で一致。床・hazard・環境設定を維持。
- slum の配置キャッシュだけ a2 へ。他区画のキーは維持。
- 動的部分は小型Canvasを共通16MiB LRUに保存。菌糸3群は2枚の位相基底画像を加算合成し、動的drawImageを2回に抑制。箱祠も2回、ラックは0回。

## ギャラリー
chips.png / chips.svg: 無地＋slum床、1倍＋2倍を目視確認。
これはCanvas呼出しをSVGへ記録しlibrsvgでPNG化したオフライン資料で、実機スクリーンショットではない。
加算合成や細線のラスタライズはブラウザと異なる可能性がある。
gallery.html: 実際のCanvas描画による単体確認用。ブラウザで開くと呼吸発光も確認できる。
node game/tools/slum-variety-gallery.cjs と python3 game/tools/slum-variety-gallery-png.py で静止資料を再生成。

## 実施済み
node game/tools/check-slum-variety.cjs:
JS構文、40 seedで配置再現性、画面内14個/高物4個/種類別上限、ウェイト合計100、
高さ40超の種類4種、9種×7時刻の有限描画引数・描画中乱数不使用、
新規3種はキャッシュ後120時刻でパス再構築なし・動的画像最大2枚。
検査時キャッシュ132104 bytes、16MiB以内。
残存6種の描画一致と git diff --check も確認。

## 未実施・引継ぎ
ブラウザ/実機環境がないため、通常3画面で自然/信仰が最低2個写ること、戦闘・透過・puddle付近の視認性、
カメラ移動・最小最大倍率・DPR、実機スクリーンショット、CPU/P95とフレーム時間+10%以内は未確認。
配置の静的検査は実機QCの代替ではない。

設計仕様の変更なし。3群発光を動的2枚に収める実装方法のみ工夫した。
元リポジトリの .git は読取専用のため、/tmp の共有オブジェクト・疎チェックアウトでコミット。
push先は元リポジトリ（読取専用）なのでpushせず、適用用patchと完成HTMLを納品。
パッチは feat/slum-map-art 上で git am すること。live/main に直接適用しない。
