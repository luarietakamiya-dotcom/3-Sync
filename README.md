# 3-Sync Editable Site

## 開き方
解凍して `index.html` をブラウザで開いてください。

## 編集しやすい構成
基本的な修正は `site-data.js` だけでできます。

### ファイル構成
```text
index.html        トップページ
wallpapers.html   壁紙一覧ページ
site-data.js      文章・曲・メンバー・壁紙・ライブ情報
style.css         見た目
script.js         再生プレイヤー・自動生成・フィルター
assets/           画像と音源
```

## 曲を差し替える
1. `assets/audio/` に mp3 / wav を入れる
2. `site-data.js` の `tracks` の `src` を変更

例:
```js
{
  title: "曲名",
  artist: "3-Sync",
  src: "./assets/audio/song.mp3",
  cover: "./assets/logo.png",
}
```

## 壁紙を追加する
1. `assets/wallpapers/` に画像を入れる
2. `site-data.js` の `wallpapers` に追加

## ヒーロー画像を差し替える
`assets/hero.jpg` を同じ名前で差し替えるだけです。

## 入っている機能
- 本当に再生できる音楽プレイヤー
- 曲リスト自動生成
- ニュース自動生成
- メンバー自動生成
- 壁紙一覧自動生成
- 壁紙フィルター
- スマホメニュー


## Player Plus 追加仕様

今回追加した機能:

- 左のジャケット欄に、MP3内の埋め込み画像を自動表示
- 埋め込み画像がない場合は `site-data.js` の `cover` を表示
- 曲リストは6曲ぶんの高さで固定、7曲目以降はスクロール
- 音量スライダー
- 1曲リピート
- 全曲リピート
- ランダム再生

### MP3ジャケット画像について

ブラウザ上で MP3 の ID3v2 APIC/PIC を簡易読み取りします。  
ただし、MP3の作り方によっては読み取れないことがあります。  
その場合は自動で `cover` にフォールバックします。

```js
{
  title: "曲名",
  artist: "3-Sync",
  src: "./assets/audio/song.mp3",
  cover: "./assets/jacket.jpg",
}
```
