(function () {
  'use strict';

  /* ── Inject all gallery CSS ─────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent =
    '#campusGallery .g-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:220px;gap:18px;width:100%}' +
    '#campusGallery .g-card{position:relative;border-radius:22px;overflow:hidden;background:#f5f5f5;box-shadow:0 12px 35px rgba(0,0,0,.08);transition:transform .4s ease,box-shadow .4s ease}' +
    '#campusGallery .g-card:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,.12)}' +
    '#campusGallery .g-card img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity .6s ease}' +
    '#campusGallery .g-card .g-img-a{position:absolute;inset:0;opacity:1;z-index:1}' +
    '#campusGallery .g-card .g-img-b{position:absolute;inset:0;opacity:0;z-index:0}' +
    '@media(max-width:820px){#campusGallery .g-grid{grid-template-columns:repeat(2,1fr);gap:14px}#campusGallery .g-card{grid-row:auto!important;grid-column:auto!important}}' +
    '@media(max-width:560px){#campusGallery .g-grid{gap:10px;grid-auto-rows:160px}}';
  document.head.appendChild(style);

  var container = document.getElementById('campusGallery');
  if (!container) return;

  /* ── Fallback images ────────────────────────────────────────────────── */
  var FALLBACKS = [
    "https://static.wixstatic.com/media/ab471d_2b50e5f33ef24dca990910bc2ebe124c~mv2.png",
    "https://static.wixstatic.com/media/ab471d_554e9f32a87f44858cad9c15a8221a5f~mv2.png",
    "https://static.wixstatic.com/media/ab471d_34607a71c79440dabed34a6307b420a5~mv2.png"
  ];

  /* ── Fixed 12-card layout ──────────────────────────────────────────────
     Each entry: [grid-row, grid-column, row-span, col-span]              */
  var CARD_LAYOUT = [
    [1, 1, 2, 2],   // Card1: rows 1-2, cols 1-2
    [1, 3, 1, 1],   // Card2: row 1, col 3
    [2, 3, 1, 2],   // Card3: row 2, cols 3-4
    [3, 1, 2, 1],   // Card4: rows 3-4, col 1
    [1, 4, 1, 1],   // Card5: row 1, col 4
    [3, 2, 2, 2],   // Card6: rows 3-4, cols 2-3
    [3, 4, 1, 1],   // Card7: row 3, col 4
    [5, 1, 1, 2],   // Card8: row 5, cols 1-2
    [4, 4, 1, 1],   // Card9: row 4, col 4
    [5, 3, 2, 1],   // Card10: rows 5-6, col 3
    [5, 4, 1, 1],   // Card11: row 5, col 4
    [6, 1, 1, 1]    // Card12: row 6, col 1
  ];

  var TOTAL = 12;
  var cards = [];
  var images = [];
  var imgPtr = 0;
  var flipTimer = null;

  /* ── Read images ────────────────────────────────────────────────────── */
  function getImages() {
    if (typeof galleryImages !== 'undefined' && Array.isArray(galleryImages) && galleryImages.length > 0) {
      return galleryImages;
    }
    return FALLBACKS;
  }

  /* ── Build 12-element grid ──────────────────────────────────────────── */
  function build() {
    container.innerHTML = '';
    var grid = document.createElement('div');
    grid.className = 'g-grid';
    cards = [];

    for (var i = 0; i < TOTAL; i++) {
      var lay = CARD_LAYOUT[i];
      var card = document.createElement('div');
      card.className = 'g-card';
      card.style.gridRow = lay[0] + ' / ' + (lay[0] + lay[2]);
      card.style.gridColumn = lay[1] + ' / ' + (lay[1] + lay[3]);

      var a = document.createElement('img');
      a.className = 'g-img-a';
      a.alt = '';
      a.loading = 'lazy';
      a.decoding = 'async';

      var b = document.createElement('img');
      b.className = 'g-img-b';
      b.alt = '';
      b.loading = 'lazy';
      b.decoding = 'async';

      card.appendChild(a);
      card.appendChild(b);
      card._a = a;
      card._b = b;
      card._active = 'a';
      card._currentIdx = -1;

      grid.appendChild(card);
      cards.push(card);
    }

    container.appendChild(grid);
  }

  /* ── Fill all cards (repeat if fewer images than cards) ─────────────── */
  function fill() {
    var total = images.length;
    if (total === 0) return;

    for (var i = 0; i < TOTAL; i++) {
      var idx = i % total;
      var card = cards[i];
      card._currentIdx = idx;
      card._a.src = images[idx];
      card._b.src = images[idx];
      card._a.style.opacity = '1';
      card._b.style.opacity = '0';
      card._active = 'a';
    }

    imgPtr = TOTAL % total;
  }

  /* ── Replace one random card every 4 seconds ────────────────────────── */
  function rotate() {
    var total = images.length;
    if (total < 2) { schedule(); return; }

    var ci = Math.floor(Math.random() * TOTAL);
    var card = cards[ci];

    var nextIdx = imgPtr % total;
    imgPtr = (imgPtr + 1) % total;
    if (nextIdx === card._currentIdx) {
      nextIdx = imgPtr % total;
      imgPtr = (imgPtr + 1) % total;
    }

    card._currentIdx = nextIdx;
    var url = images[nextIdx];
    var hidden = card._active === 'a' ? card._b : card._a;
    var visible = card._active === 'a' ? card._a : card._b;

    var img = new Image();
    img.onload = function () {
      hidden.src = url;
      hidden.style.opacity = '1';
      visible.style.opacity = '0';
      card._active = card._active === 'a' ? 'b' : 'a';
      schedule();
    };
    img.onerror = function () {
      schedule();
    };
    img.src = url;
  }

  function schedule() {
    if (flipTimer) clearTimeout(flipTimer);
    flipTimer = setTimeout(rotate, 4000);
  }

  /* ── Start ──────────────────────────────────────────────────────────── */
  images = getImages();
  if (images.length === 0) return;

  build();
  fill();
  schedule();

})();
