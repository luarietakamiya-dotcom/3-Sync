/*
  script.js
  実際の動き担当。
  普段の編集は site-data.js だけでOK。
*/

const DATA = window.SITE_DATA || {};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

document.querySelectorAll("[data-bind]").forEach((el) => {
  const value = getByPath(DATA, el.dataset.bind);
  if (value !== undefined) el.textContent = value;
});

/* スマホメニュー */
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".global-nav");
const listenButton = document.querySelector(".listen-button");

toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  nav?.classList.toggle("open");
  listenButton?.classList.toggle("open");
});

/* News */
const newsGrid = document.getElementById("newsGrid");
if (newsGrid) {
  newsGrid.innerHTML = (DATA.news || []).slice(0, 3).map((item) => `
    <article class="news-card">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
      <div class="news-body">
        <span>${escapeHTML(item.tag)}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <time>${escapeHTML(item.date)}</time>
      </div>
    </article>
  `).join("");
}

const newsPageGrid = document.getElementById("newsPageGrid");
if (newsPageGrid) {
  newsPageGrid.innerHTML = (DATA.news || []).map((item) => `
    <article class="news-card">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">
      <div class="news-body">
        <span>${escapeHTML(item.tag)}</span>
        <h3>${escapeHTML(item.title)}</h3>
        <time>${escapeHTML(item.date)}</time>
      </div>
    </article>
  `).join("");
}

/* Members */
const memberGrid = document.getElementById("memberGrid");
if (memberGrid) {
  memberGrid.innerHTML = (DATA.members || []).slice(0, 3).map((member) => `
    <article class="member-card ${escapeHTML(member.color)}">
      <img src="${escapeHTML(member.image)}" alt="${escapeHTML(member.name)}">
      <div class="member-body">
        <h3>${escapeHTML(member.name)}</h3>
        <p class="member-jp">${escapeHTML(member.jpName)}</p>
        <p>${escapeHTML(member.role)}</p>
      </div>
    </article>
  `).join("");
}

const membersPageGrid = document.getElementById("membersPageGrid");
if (membersPageGrid) {
  membersPageGrid.innerHTML = (DATA.members || []).map((member) => `
    <article class="member-card ${escapeHTML(member.color)}">
      <img src="${escapeHTML(member.image)}" alt="${escapeHTML(member.name)}">
      <div class="member-body">
        <h3>${escapeHTML(member.name)}</h3>
        <p class="member-jp">${escapeHTML(member.jpName)}</p>
        <p>${escapeHTML(member.role)}</p>
      </div>
    </article>
  `).join("");
}

/* Live */
const liveGrid = document.getElementById("liveGrid");
if (liveGrid) {
  liveGrid.innerHTML = (DATA.lives || []).slice(0, 3).map((live) => `
    <article class="live-card">
      <div class="date-box">
        <strong>${escapeHTML(live.date)}</strong>
        <span>${escapeHTML(live.day)}</span>
      </div>
      <div>
        <h3>${escapeHTML(live.title)}</h3>
        <p>${escapeHTML(live.place)}</p>
      </div>
    </article>
  `).join("");
}

const livePageGrid = document.getElementById("livePageGrid");
if (livePageGrid) {
  livePageGrid.innerHTML = (DATA.lives || []).map((live) => `
    <article class="live-card">
      <div class="date-box">
        <strong>${escapeHTML(live.date)}</strong>
        <span>${escapeHTML(live.day)}</span>
      </div>
      <div>
        <h3>${escapeHTML(live.title)}</h3>
        <p>${escapeHTML(live.place)}</p>
      </div>
    </article>
  `).join("");
}

/* Wallpapers preview */
const preview = document.getElementById("wallpaperPreviewGrid");
if (preview) {
  preview.innerHTML = (DATA.wallpapers || []).slice(0, 3).map((wall) => {
    const cats = Array.isArray(wall.category) ? wall.category.join(", ") : (wall.category || "");
    return `
    <a class="wall-card" href="./wallpapers.html">
      <img src="${escapeHTML(wall.image)}" alt="${escapeHTML(wall.title)}">
      <div>
        <strong>${escapeHTML(wall.title)}</strong>
        <span>${escapeHTML(cats)}</span>
      </div>
    </a>
  `}).join("");
}

/* Wallpapers gallery */
const gallery = document.getElementById("wallpaperGallery");
if (gallery) {
  gallery.innerHTML = (DATA.wallpapers || []).map((wall) => {
    const cats = Array.isArray(wall.category) ? wall.category : [wall.category || ""];
    const chars = Array.isArray(wall.characters) ? wall.characters : [wall.characters || ""];
    const tags = [...cats, ...chars].map(t => String(t).toLowerCase()).join(",");
    const displayCats = cats.join(", ");
    return `
    <article class="gallery-item wall-card" data-tags="${escapeHTML(tags)}">
      <img src="${escapeHTML(wall.image)}" alt="${escapeHTML(wall.title)}">
      <div>
        <strong>${escapeHTML(wall.title)}</strong>
        <span>${escapeHTML(displayCats)}</span>
      </div>
      <a class="download-button" href="${escapeHTML(wall.image)}" download>Download</a>
    </article>
  `}).join("");
}

/* 壁紙フィルター */
document.querySelectorAll(".chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter.toLowerCase();
    document.querySelectorAll(".gallery-item").forEach((item) => {
      const tags = item.dataset.tags ? item.dataset.tags.split(",") : [];
      item.classList.toggle("hidden-item", filter !== "all" && !tags.includes(filter));
    });
  });
});

/* =========================================================
   Player Plus
   ========================================================= */
(() => {
  const audio = document.getElementById("audioElement");
  const playPauseBtn = document.getElementById("playPause");
  const prevBtn = document.getElementById("prevTrack");
  const nextBtn = document.getElementById("nextTrack");
  const muteBtn = document.getElementById("muteToggle");
  const seekBar = document.getElementById("seekBar");
  const volumeBar = document.getElementById("volumeBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const playerTitle = document.getElementById("playerTitle");
  const albumArt = document.getElementById("albumArt");
  const coverTitle = document.getElementById("coverTitle");
  const coverSource = document.getElementById("coverSource");
  const trackList = document.getElementById("trackList");
  const repeatOneBtn = document.getElementById("repeatOne");
  const repeatAllBtn = document.getElementById("repeatAll");
  const shuffleBtn = document.getElementById("shuffleToggle");

  if (!audio || !trackList) return;

  const tracks = Array.isArray(DATA.tracks) ? DATA.tracks : [];
  let currentTrackIndex = 0;
  let repeatOne = false;
  let repeatAll = true;
  let shuffle = false;
  let lastObjectUrl = null;

  function esc(value) {
    return escapeHTML(value);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderTracks() {
    trackList.innerHTML = tracks.map((track, index) => `
      <li data-index="${index}">
        <span>${String(index + 1).padStart(2, "0")} ${esc(track.title)}</span>
        <time>${esc(track.artist || "")}</time>
      </li>
    `).join("");
  }

  /*
    MP3 ID3v2 APIC/PIC 簡易読み取り。
    取れない場合は site-data.js の cover を使います。
  */
  async function extractArtworkFromAudio(src) {
    try {
      const response = await fetch(src);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null;

      const version = bytes[3];
      const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);

      let offset = 10;
      const end = 10 + tagSize;

      while (offset < end) {
        let frameId = "";
        let frameSize = 0;
        let headerSize = 0;

        if (version === 2) {
          frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
          frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
          headerSize = 6;
        } else {
          frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
          if (version === 4) {
            frameSize =
              ((bytes[offset + 4] & 0x7f) << 21) |
              ((bytes[offset + 5] & 0x7f) << 14) |
              ((bytes[offset + 6] & 0x7f) << 7) |
              (bytes[offset + 7] & 0x7f);
          } else {
            frameSize =
              (bytes[offset + 4] << 24) |
              (bytes[offset + 5] << 16) |
              (bytes[offset + 6] << 8) |
              bytes[offset + 7];
          }
          headerSize = 10;
        }

        if (!frameId.trim() || frameSize <= 0) break;

        const frameStart = offset + headerSize;
        const frameEnd = frameStart + frameSize;
        const frame = bytes.slice(frameStart, frameEnd);

        if (frameId === "APIC" || frameId === "PIC") {
          let i = 0;
          i += 1; // text encoding

          let mime = "image/jpeg";

          if (frameId === "APIC") {
            const mimeStart = i;
            while (i < frame.length && frame[i] !== 0) i++;
            mime = new TextDecoder().decode(frame.slice(mimeStart, i)) || "image/jpeg";
            i += 1;
          } else {
            const fmt = new TextDecoder().decode(frame.slice(i, i + 3)).toLowerCase();
            mime = fmt.includes("png") ? "image/png" : "image/jpeg";
            i += 3;
          }

          i += 1; // picture type

          while (i < frame.length && frame[i] !== 0) i++;
          i += 1;

          const imageBytes = frame.slice(i);
          if (imageBytes.length > 0) {
            return URL.createObjectURL(new Blob([imageBytes], { type: mime }));
          }
        }

        offset = frameEnd;
      }
    } catch (error) {
      console.warn("Artwork extraction failed:", error);
    }
    return null;
  }

  async function updateArtwork(track) {
    if (!albumArt) return;

    if (lastObjectUrl) {
      URL.revokeObjectURL(lastObjectUrl);
      lastObjectUrl = null;
    }

    if (coverTitle) coverTitle.textContent = track.title || "Artwork";
    if (coverSource) coverSource.textContent = "checking mp3 metadata...";

    const embedded = await extractArtworkFromAudio(track.src);

    if (embedded) {
      lastObjectUrl = embedded;
      albumArt.src = embedded;
      if (coverSource) coverSource.textContent = "from mp3 embedded artwork";
    } else {
      albumArt.src = track.cover || "./assets/logo.png";
      if (coverSource) coverSource.textContent = "from site-data.js cover";
    }
  }

  function setModeButtons() {
    repeatOneBtn?.classList.toggle("active", repeatOne);
    repeatAllBtn?.classList.toggle("active", repeatAll);
    shuffleBtn?.classList.toggle("active", shuffle);
  }

  function setActiveTrack(index, autoplay = false) {
    if (tracks.length === 0) return;

    currentTrackIndex = (index + tracks.length) % tracks.length;
    const track = tracks[currentTrackIndex];

    audio.src = track.src;
    audio.load();

    if (playerTitle) {
      playerTitle.innerHTML = `${esc(track.title)} <span>/ ${esc(track.artist || "3-Sync")}</span>`;
    }

    document.querySelectorAll("#trackList li").forEach((li) => {
      li.classList.toggle("active", Number(li.dataset.index) === currentTrackIndex);
    });

    if (currentTimeEl) currentTimeEl.textContent = "00:00";
    if (durationEl) durationEl.textContent = "00:00";
    if (seekBar) seekBar.value = 0;

    updateArtwork(track);

    if (autoplay) audio.play();
  }

  function nextIndex() {
    if (shuffle && tracks.length > 1) {
      let next = currentTrackIndex;
      while (next === currentTrackIndex) {
        next = Math.floor(Math.random() * tracks.length);
      }
      return next;
    }
    return currentTrackIndex + 1;
  }

  renderTracks();
  setActiveTrack(0, false);
  setModeButtons();

  if (volumeBar) audio.volume = Number(volumeBar.value);

  playPauseBtn?.addEventListener("click", () => {
    audio.paused ? audio.play() : audio.pause();
  });

  prevBtn?.addEventListener("click", () => {
    setActiveTrack(currentTrackIndex - 1, true);
  });

  nextBtn?.addEventListener("click", () => {
    setActiveTrack(nextIndex(), true);
  });

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "♫";
  });

  volumeBar?.addEventListener("input", () => {
    audio.volume = Number(volumeBar.value);
    if (audio.volume > 0) {
      audio.muted = false;
      if (muteBtn) muteBtn.textContent = "♫";
    }
  });

  repeatOneBtn?.addEventListener("click", () => {
    repeatOne = !repeatOne;
    if (repeatOne) repeatAll = false;
    setModeButtons();
  });

  repeatAllBtn?.addEventListener("click", () => {
    repeatAll = !repeatAll;
    if (repeatAll) repeatOne = false;
    setModeButtons();
  });

  shuffleBtn?.addEventListener("click", () => {
    shuffle = !shuffle;
    setModeButtons();
  });

  trackList.addEventListener("click", (event) => {
    const item = event.target.closest("li[data-index]");
    if (!item) return;
    setActiveTrack(Number(item.dataset.index), true);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("timeupdate", () => {
    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
    if (seekBar && audio.duration) {
      seekBar.value = (audio.currentTime / audio.duration) * 100;
    }
  });

  seekBar?.addEventListener("input", () => {
    if (!audio.duration) return;
    audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
  });

  audio.addEventListener("play", () => {
    if (playPauseBtn) playPauseBtn.textContent = "Ⅱ";
  });

  audio.addEventListener("pause", () => {
    if (playPauseBtn) playPauseBtn.textContent = "▶";
  });

  audio.addEventListener("ended", () => {
    if (repeatOne) {
      audio.currentTime = 0;
      audio.play();
      return;
    }

    const atLast = currentTrackIndex === tracks.length - 1;
    if (atLast && !repeatAll && !shuffle) {
      if (playPauseBtn) playPauseBtn.textContent = "▶";
      return;
    }

    setActiveTrack(nextIndex(), true);
  });
})();
