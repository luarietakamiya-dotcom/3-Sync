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
```

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
