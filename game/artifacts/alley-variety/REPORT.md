# alley 種類の多様化

基点: feat/alley-map-art。作業コピー: /tmp/alley-work。main へのマージなし。
設計原文は指定 .md が存在せず、../briefs/2026-11-08-map-variety-proposal-claude-raw.txt の §0・§2・§6 を使用。

- 新規: alley_lantern (30×54), alley_stonewall (52×36), alley_fox (26×40), alley_pots (30×32)。fd/wt/max/near/nd/light は設計表どおり。ウェイト合計104は設計表の数値を維持。
- 削除: alley_directory / alley_locker / alley_pack / alley_price のロスター・描画・ロッカー専用ヘルパー。
- 維持: shop/canopy/holo/pawn。case は既存の数字表示を維持し、静的な物理値札3枚を追加。
- 灯籠は6段・店庇と同じ3:4の軒角度、窓光88〜100% (3.1秒と1.7秒のsinの和)。狐は8秒中0.3秒のみ目が発光。花は4秒で60〜100%。石垣は静止。
- 新規物体の接地影は矩形。床光は灯籠の既存light機構だけ。石材は指定の暖灰4色、雨の艶線は静的。
- 新規動的レイヤーは共有LRUキャッシュに保存、毎フレームはdrawImageとglobalAlphaのみ。alley の配置キャッシュだけ版2に更新。他区画の版は不変。
- tallH を41に補正し、高さ40px超の5種を maxTall:4 の対象とする。maxScreen:14、既存入口clear、その他の区画設定は維持。

## チップ先行

BG_ART組み込み前に単体コードを描画し、chips.svg / chips.png を無地とalley床、各1倍・2倍で生成して目視。組み込み後も再生成して確認。これは実際のCanvas命令をSVGへ記録したオフライン校正画像であり、ブラウザのスクリーンショットではない。葉の丸葉・シダ・多肉の差を追加して最終確認。

## 検証

実施: HTML内JavaScriptの構文、40シードの配置再現性、falling回避・入口clear・画面内総数／種類別／高物の上限・外周配置、9種と高5種の構成、旧ID除去、7時刻での新規描画、数値引数の有限性、キャッシュ容量、120時刻のアニメーション暖機後に毎フレームの幾何再構築なし・最大2枚以内。結果は static-check.txt。

未実施: 実機での通常画面3枚（非SF最低2個）、fallingとの視覚識別、キャラ背後の透過、他区画と比較するシルエット判定、基準比+10%以内のフレーム描画時間。ローカルHTTP待受はEPERM、Chromiumは起動ポリシーで終了。自動承認レビューによる拒否ではなく実行環境制約。ブラウザ検証スクリプトは game/tools/alley-browser.cjs に残した。

## 取り込み

成果物ディレクトリの alley-variety.patch を feat/alley-map-art 上で git am する。完成HTML index.html は game/index.html の置換用（既存assetsはリポジトリのものを使用）。元チェックアウトの border ブランチと作業中ファイルは変更していない。
