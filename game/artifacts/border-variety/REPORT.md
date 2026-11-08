# border 管理区境界 — 引継ぎ

対象ブランチ: feat/border-map-art。設計資料は briefs/2026-11-08-map-variety-proposal-claude-raw.txt（指定の .md は存在せず）。

変更: border_panel → border_stele (36×62/fd12/wt10)、border_marker → border_stone (18×28/fd10/wt12/pair34–42)、border_relay → border_quartz (34×40/fd14/wt10)。旧描画・旧ロスター削除。他6種の描画・ロスターは維持。

石灰岩4色、白〜淡青の対称3本柱、二段基壇と管理プレートを実装。碑文8秒60–85%、タグ4秒中0.4秒（ペアは2秒差）、霜光6秒上昇。動的要素は各1個。静的本体と発光部は既存LRUへ別IDで格納し、毎フレームは画像転送と透明度のみ。新規の接地は暗い立体基礎、床反射矩形は新規3種を対象外にした。border の配置キャッシュのみ v2。他区画のキーは維持。tallH=41 として高さ40px超を上限集計する。

チップ先行: ロスター組込前に実描画コードをSVG化→librsvg/CairoでPNG化して無地・border床、1倍・2倍を目視。組込後の最終 chips.png / chips.svg は標石のペアも表示。これはオフラインCanvas呼出し変換であり、ブラウザスクリーンショットではない。

検証済み:
- 全インラインJavaScriptの構文、git diff --check。
- 80シードで再現性、境界内、40px超の外周配置、画面内14個/高い物4個、種類別上限、9種・高低比4:5、centerGap40、barrier/stone max2。
- 新規3種の周期境界を含む描画呼出し、画像転送引数の有限性。
- ギャラリーの形、材質色、サイズ、清潔な直線構成の目視確認。

再生成: node game/tools/border-variety-gallery.cjs && python3 game/tools/border-variety-gallery-png.py
静的配置検査: BORDER_CHECK=1 node game/tools/border-variety-gallery.cjs （検査描画もSVGへ入るため、その後通常生成を再実行）。

未実施: ブラウザ/実機起動、通常画面3枚で非SFが最低2つの確認、プレイヤー背後での透明化の実機確認、electric/noiseの重畳比較、描画時間+10%以内の比較。利用可能なブラウザ実行ファイルが見つからず、これらの受入は連絡係長へ引継ぎ。

標石は必ず同じ向き・同じ接地Yの2本組で配置し、距離34–42px、LED位相差2秒。2本分の配置条件を満たせない場合はその候補を見送る。他種の任意ペア生成は維持。

元リポジトリの .git が読み取り専用のため切替・コミット不可。現在の front 作業を保護し、/tmp/border-work の sparse shared clone で対象ブランチに実装・コミット。元リポジトリ側 game/artifacts/border-variety に完成HTML、ギャラリー、ツール、適用パッチを保存。元ツリーの game/index.html と現在ブランチは変更していない。main へのマージなし。
