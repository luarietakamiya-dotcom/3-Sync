# 到達報酬・アルバム 検証レポート

実績は到達11件、育成22件、エンド17件。報酬データの合計は同調チップ61個、共鳴の欠片215個。報酬のチップが既存の所持可能数を超える場合は、既存のチップ取得処理で欠片に換算する。素材は床1相当の既存評価額で直接倉庫に入り、龍鱗片は既存の種類別ストックに加算する。えーちゃんの実績IDには指定どおり `echan` を用い、キャラデータは現行の `ht` を参照する。

アルバムは本線20枠とアーカイブ12枠。アーカイブにはボス設定画5枚、龍脈溢界アリーナ1枚、ポスター6枚を収録。本線20枠は解放後に「準備中」と表示する。設定画は `design_final.png` がある場合はそれを使用し、キングヨーグルトとノイズDJには draft 1、執行ユニットには draft 2 を使用した。

## 検証結果

| 検証 | 結果 |
| --- | --- |
| 実ゲームスクリプトの Node VM 検証 `check_achievements_vm.cjs` | 通過。初期状態と旧セーブの無通知遡及、一覧の順序、報酬6種、キー999上限、二重受け取り防止、称号とHUD用マークアップ、トロフィー6枠、アルバム4状態・NEW・画像送り、全50条件と全32枠解放を確認 |
| ギャラリーデータ・画像 | 通過。JSONが1行、32枠のIDが一意、10刻みの順序、12枠すべてに実画像と480×270のWebPサムネイルが存在。変換した本画像の長辺は1920px |
| `git diff --check`・ブラウザ用ハーネスの構文 | 通過 |
| 既存 `test.js`、`test_overflow.js`、`dbg_alliance.js`、`check_sp_system.js`、`check_rank_scale.js` | 5本とも起動時にローカルHTTPサーバーの `listen(0)` が `EPERM`。Playwrightのリクエストルーティングで配信する一時コピーでも、Chromiumが起動時の `shutdown` を拒否され、テスト本体に到達できなかった |
| 新規 `check_achievements.js` と画面キャプチャ | ハーネスに実装済み。Chromium起動制限によりブラウザ上の検証とPNG生成は未実施 |

ブラウザで実行できる環境では、Playwrightが読み込める状態で次のコマンドを実行する。任意のChromium実行ファイルを `EXE` で指定できる。結果のPNGはこのレポートと同じディレクトリに出力される。

```sh
node game/artifacts/achievement-gallery/check_achievements_vm.cjs
node game/artifacts/achievement-gallery/check_achievements.js
```

キャプチャ対象は実績画面（`achievements.png`）、称号装着後HUD（`title-hud.png`）、トロフィー棚（`trophies.png`）、アルバム一覧（`album.png`）、ギャラリー拡大（`gallery-full.png`）。

## 連絡係長による引き継ぎ検証（2026-11-23、ブラウザ実環境）

Codexサンドボックスでは Chromium 起動不可だったため、連絡係長が実環境で検証した。

| 検証 | 結果 |
| --- | --- |
| test.js | 17/17 OK |
| test_overflow.js | 62/62 ALL OK |
| dbg_alliance.js | 17/17 OK |
| check_sp_system.js | 29/29 ALL OK |
| check_rank_scale.js | 倍率36項目はOK。ただし「nrush ランクV をエンド想定ビルドで完走」1項目がNG（wave14で全滅）。**対照として未変更の main (3da98cc) でも同項目がNG（wave5で全滅）**＝オートプレイ個体差による既知の不安定項目であり、本変更の影響ではない |
| check_achievements_vm.cjs | PASS（全50条件・全32枠解放・遡及・報酬・二重防止・称号・トロフィー・ギャラリー状態） |
| check_achievements.js（ブラウザ） | PASS（0 page errors）。スクリーンショット5点（achievements / title-hud / trophies / album / gallery-full）を目視確認済み |

### ハーネス側の最小修正（ゲームコードではない）
- check_achievements.js：起動直後のDOM数え上げが、ゲーム本体の boot（loadData→start）完了前の描画と競合して 0 件になる事象を確認。実プレイでは boot 完了まで家に入れないため実害はないが、ハーネスの openGame にデータ読み込み完了待ちを追加し、件数アサートの前に waitCount（描画完了待ち）を挟んだ。アサート内容自体は変更していない。

### 判断・注記
- アーカイブのボス設定画は、原画どおり緑背景（#00FF00）の設計画をそのまま収録した（キングヨーグルト／ノイズDJ=draft1、ジャンククイーン／歪み中枢体=design_final、監理執行機=draft2）。
- えーちゃんの実績IDは仕様どおり `echan` 系、キャラデータ参照は現行コードの `ht` に接続。
- C5 の龍鱗片「溢界クリア1回ぶん」は bossFrag=5 を基準に 5/5/5/10/15 と固定。C6ランクVの「龍鱗片2回ぶん」は10。
- 素材報酬は個数指定で、既存 addMat（1層目相当の価値）により S.mats へ加算。
