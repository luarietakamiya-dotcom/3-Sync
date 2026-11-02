# 3-Sync ノイズダイブ（ブラウザゲーム）

公開URL: https://luarietakamiya-dotcom.github.io/3-Sync/game/

ビルド手順はありません。`index.html` を直接編集すれば、そのまま反映されます。

## ファイル構成

```text
game/
  index.html          ゲーム本体（HTML・CSS・JavaScriptを1ファイルにまとめている）
  bg/                 背景画像（差し替えるだけで絵が変わる）
    town.png          街の外観 640×360
    home.png          家の内観 960×300（街の上に小窓で表示）
    shop.png          怪しい店
    guild.png         ヨーデル管理所
    live.png          ライブハウス RESONANCE
    gate.png          歪みゲート
  sprites/            キャラのスプライトシート
    walk_*.png        歩き 12コマ（64×128、下3・左3・右3・上3）
    act_*.png         攻撃・ダメージ・やられ・喜び 29コマ（160×192、足元は(80,150)）
    enemies/          敵のドット絵（任意。ない場合は図形描画に戻る）
      {spriteId}.png  64×64または横一列の64×64連結コマ
  audio/              BGM（bgm_{場面}.mp3。同じ名前で差し替えれば曲が変わる）
  icons/              デバフ（ノイズ侵食）アイコン
  data/               ゲームデータ（JSON。ここに追記するだけで敵・エリア・素材が増える）
    enemies.json      敵（通常・ミッション限定・ボス）
    maps.json         エリア（10層ずつ、10層目がボス）と背景の色・飾り
    materials.json    素材（共通・エリア専用・ボス素材）
```

## データの増やし方

- **敵を増やす**：`enemies.json` に1件追加し、`maps.json` のどこかの `enemyPool` に `id` を書く。動きは `aiType`（melee_rush / ranged_keep / charger / support_buffer / debuffer / summoner / suicide / flee / boss）と `params` で決まる。見た目は `spriteId`（`index.html` の `ENEMY_DRAW` にある名前）と `color`
- **ボスの技**：`params.moves` に並べる。type は summon / charge / ring / volley / buff / debuffPulse / teleport
- **エリアを増やす**：`maps.json` の `zones` の末尾に追加すると、次の10層として開く。床の仕掛けは `hazards`（puddle / falling / electric / noise / rift）
- **素材を増やす**：`materials.json` に追加し、敵の `dropTable` に `id` を書く

データは起動時に読み込むので、`index.html` をファイルとして直接開くと動きません。GitHub Pages か、ローカルのHTTPサーバー（例：`python3 -m http.server`）で開いてください。

## 敵のドット絵画像

- ファイル名は敵の `id`（例：`pink_slime.png`）か `spriteId`（例：`slime.png`）。`id` の画像があればそれを優先し、なければ `spriteId` の画像、どちらもなければ図形で描く。`spriteId` で置く場合は、`game/sprites/enemies/{spriteId}.png` に置いてください（同じ `spriteId` の敵は画像を共有します）。
- **透過PNG・1コマ64×64px**。アニメーションは `64×64` のコマを**横一列**に並べます。例：4コマなら `256×64px`。1コマ画像も可。
- 足元の基準点は**元画像の(32,56)**。キャラの足がこの座標に来るよう描き、残りの下8pxは余白としてください。ゲーム内では敵の足元座標に一致するよう表示します。
- 表示サイズは敵の半径 `r` から算出します（概ね `2.75×r` ゲーム内px）。PNGサイズは変更せず、拡大時は最近傍補間にします。
- アニメーションは**8コマ/秒**、敵ごとに開始コマをずらしてループ再生します。幅は64の整数倍、高さは64固定。
- ファイルがない、ロードに失敗、画像サイズが仕様外の場合は、今までの `ENEMY_DRAW` 図形をそのまま使うフォールバックです。画像のない敵でもゲームは動きます。
- HPバーと状態異常アイコンは従来どおり敵の頭上に別レイヤーで描画されます。巨大な装飾は64×64の外へはみ出さないようにしてください。

キャラのIDは `luarie`（ルアリエ）・`ht`（えーちゃん）・`mimi`（夜凪ミミ）です。

## index.html の中の主な区画

コメント `/* ===== ... ===== */` で区切っています。

| 区画 | 内容 |
| --- | --- |
| data | キャラの基本性能 `CB`、ライブ `PRODUCERS`、地域 `REGIONS`、素材 `MATS`、ミッション限定敵 `SPECIAL` |
| skill trees | 調整値 `CFG`（SP上限・経験値共有など）、系統 `BRANCH`、特殊ノード `NOTABLES`、キーストーン `KEYS`、キャラ固有 `UNIQUE`、配置 `LAYOUT`、ツリー生成 `buildTree` |
| stats | ステータス計算 `statsOf(cid, unit)`。装備・スキル・一時バフはすべてここで合算 |
| town | 背景の一覧 `SCENES`、施設 `FACS`（扉の位置・タップ範囲） |
| dive | 敵の生成、戦闘、状態異常 `AIL`、ボス戦 |
| missions | 依頼の生成 `genMission`、達成判定 `progress` |
| save | セーブ／ロードと旧データの移行（`sanitize`・`finishLoad`） |

## スマホ向けの設定

- 横持ちで画面の高さが520px以下のときは、ヘッダーと右の列を詰めてステージを大きく表示する
- 探索中の「オート攻撃」（近くの敵を自動で狙う）と「拡大表示」（自キャラを中心に1.4倍で追う）は、タッチ端末では最初からON。設定はセーブに保存される
- `manifest.webmanifest` と `icons/app/` により、iPhoneの「ホーム画面に追加」から開くとブラウザのバーなしの全画面で動く。Android・PCは右上の全画面ボタンも使える

## サウンド

| ファイル | 流れる場面 |
| --- | --- |
| bgm_title.mp3 | タイトル画面（Over Sync） |
| bgm_town.mp3 | 街・歪みゲート（遠景ピアノ針） |
| bgm_home.mp3 | 家（HOME SWEET SIGNAL） |
| bgm_shop.mp3 | 怪しい店（JUNK DEALER） |
| bgm_guild.mp3 | ヨーデル管理所（CONTROL TERMINAL） |
| bgm_live.mp3 | ライブハウス RESONANCE（NEON AFTER MIDNIGHT） |
| bgm_dive.mp3 | 探索（DREAD DEPTHS） |
| bgm_boss.mp3 | ボス層（ABSOLUTE DOMINION） |
| bgm_sync.mp3 | 3-Sync発動から20秒（3-Sync Error 0）。秒数は `SYNC_BGM_SEC` |

- 場面の切り替えは `wantBgm()`、曲の割り当ては `BGM_FILES`。0.9秒でクロスフェードする
- 効果音はファイルを使わず `SFX` の表で音を合成している（音の高さ・長さ・大きさを数字で調整できる）
- 音量（BGM・効果音）と消音はセーブ画面と画面上の♪ボタン。設定はセーブに保存される
- ブラウザは最初のタップまで音を出せないので、タイトル画面の1回目のタップで音を有効にしている
- RESONANCEのジュークボックス：ゲーム内で一度聴いた曲（セーブの `heard`）を選んで流せる。曲名リストは `JUKE_LIST`。店を出ると元の曲に戻る
- セーブ画面の「タイトルに戻る」：ゲームは裏で一時停止し、「続きから」でその場から再開する

## セーブ

ブラウザの localStorage にキー `3sync-save-v1` で保存しています。端末間の移動は、ゲーム内の「セーブ」タブにある引き継ぎコードで行います。
