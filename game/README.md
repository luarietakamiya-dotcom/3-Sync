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

## セーブ

ブラウザの localStorage にキー `3sync-save-v1` で保存しています。端末間の移動は、ゲーム内の「セーブ」タブにある引き継ぎコードで行います。
