/*
  =========================================================
  site-data.js
  =========================================================
  ここを編集すれば、かなりの部分を変更できます。

  - ニュース → news
  - 曲 → tracks
  - メンバー → members
  - 壁紙 → wallpapers
  - ライブ → lives
*/

window.SITE_DATA = {
  site: {
    title: "3-Sync",
    subtitle: "Celestial Pulse Line",
    copyright: "© 2026 3-Sync",
  },

  news: [
    {
      tag: "UPDATE",
      title: "ルアリエ ビジュアル更新",
      date: "2026.05.10",
      image: "./assets/member-luarie.jpg",
    },
    {
      tag: "UPDATE",
      title: "ミミ ビジュアル更新",
      date: "2026.05.01",
      image: "./assets/member-mimi.jpg",
    },
    {
      tag: "UPDATE",
      title: "ハツエ ビジュアル更新",
      date: "2026.04.24",
      image: "./assets/member-hatsue.jpg",
    },
  ],

  /*
    曲を本物に差し替える方法:
    1. assets/audio/ に mp3 や wav を入れる
    2. src を "./assets/audio/曲名.mp3" に変える
  */
  tracks: [
    {
      title: "Signal Lost",
      artist: "3-Sync",
      src: "./assets/audio/Signal Lost.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Three on the Road",
      artist: "3-Sync",
      src: "./assets/audio/Three on the Road.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Tin-Song Lull",
      artist: "3-Sync",
      src: "./assets/audio/Tin-Song Lull.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Tin-Song Lull -2nd",
      artist: "3-Sync",
      src: "./assets/audio/Tin-Song Lull -2nd.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Campfire Cartwheel",
      artist: "3-Sync",
      src: "./assets/audio/Campfire Cartwheel.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Sunlit",
      artist: "3-Sync",
      src: "./assets/audio/Sunlit.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "「遠景ピアノ針」",
      artist: "3-Sync",
      src: "./assets/audio/「遠景ピアノ針」.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "「遠景ピアノ針」-2nd",
      artist: "3-Sync",
      src: "./assets/audio/「遠景ピアノ針」 -2nd.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Market Accordion",
      artist: "3-Sync",
      src: "./assets/audio/Market Accordion.mp3",
      cover: "./assets/logo.png",
    },
    {
      title: "Distant Impact Hits",
      artist: "3-Sync",
      src: "./assets/audio/Distant Impact Hits.mp3",
      cover: "./assets/logo.png",
    },
  ],

  members: [
    {
      name: "Luarie",
      jpName: "ルアリエ",
      role: "leader, visionary voice",
      image: "./assets/member-luarie.jpg",
      color: "cyan",
    },
    {
      name: "Mimi",
      jpName: "夜凪ミミ",
      role: "quiet tone, hidden fire",
      image: "./assets/member-mimi.jpg",
      color: "blue",
    },
    {
      name: "Hatsue",
      jpName: "ハツエ / えーちゃん",
      role: "vivid rhythm, bright heart",
      image: "./assets/member-hatsue.jpg",
      color: "pink",
    },
  ],

  wallpapers: [
    {
      title: "Luarie Portrait",
      category: "luarie",
      image: "./assets/wallpapers/luarie-portrait.jpg",
    },
    {
      title: "Luarie Sheet",
      category: "luarie",
      image: "./assets/wallpapers/luarie-sheet.png",
    },
    {
      title: "Mimi Portrait",
      category: "mimi",
      image: "./assets/wallpapers/mimi-portrait.jpg",
    },
    {
      title: "Mimi Sheet",
      category: "mimi",
      image: "./assets/wallpapers/mimi-sheet.png",
    },
    {
      title: "Hatsue Portrait",
      category: "hatsue",
      image: "./assets/wallpapers/hatsue-portrait.jpg",
    },
    {
      title: "Hatsue Sheet",
      category: "hatsue",
      image: "./assets/wallpapers/hatsue-sheet.png",
    },
    {
      title: "3-Sync Logo",
      category: "logo",
      image: "./assets/wallpapers/3sync-logo.png",
    },
  ],

  lives: [
    {
      date: "06.21",
      day: "SAT",
      title: "3-Sync LIVE 2026 “Re:Pulse”",
      place: "TOKYO DOME CITY HALL",
    },
    {
      date: "07.18",
      day: "SAT",
      title: "SYNCHRONIC SUMMER FES 2026",
      place: "幕張メッセ 国際展示場 9-11 Hall",
    },
    {
      date: "08.30",
      day: "SUN",
      title: "3-Sync Acoustic Session",
      place: "LINE CUBE SHIBUYA",
    },
  ],
};
