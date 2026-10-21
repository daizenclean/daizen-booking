// ============================================================
// DAIZEN — 全ページ共通（ヘッダー・フッター・連絡先）
// 電話番号やメールが変わったら、ここだけ直せば全ページに反映されます。
// ============================================================
const SITE = {
  name: "DAIZEN",
  company: "株式会社 大善",
  tel: "03-3442-5646",
  mobile: "080-9544-3951",
  email: "daizen.clean@gmail.com",
  hours: "8:00〜19:00（年中無休）",
  address: "東京都港区白金台5-22-11 ソフトタウン白金507",
  ekiten: "https://www.ekiten.jp/shop_42207623/reserve/",
  // Google Apps Script のウェブアプリURL（README の手順で取得）。
  // 予約フォームの送信先と、Google口コミ（評価・件数）の自動更新の両方に使います。
  gasUrl: "https://script.google.com/macros/s/AKfycbys5FPryJ91LtK9opx7Do1_65IifPgfROy3a1ec3EwE-KPVysIV00ich69rZIwAxMfo/exec",
  sns: {
    instagram: "https://www.instagram.com/daizen_seisou/",
    x: "https://twitter.com/DAIZEN_clean",
    facebook: "https://www.facebook.com/profile.php?id=100083746310246",
  },
};

const NAV = [
  ["index.html#services", "サービス"],
  ["price.html", "料金表"],
  ["index.html#method", "DAIZENメソッド"],
  ["index.html#flow", "ご利用の流れ"],
  ["index.html#faq", "よくある質問"],
  ["index.html#company", "会社概要"],
  ["column/index.html", "コラム"],
  ["recruit.html", "求人"],
];

const ICON = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  tel: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2c-2.7 0-3 0-4.1.1C5 2.2 2.2 5 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.1 2.9 2.9 5.7 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c2.9-.1 5.7-2.9 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1C21.8 5 19 2.2 16.1 2.1 15 2 14.7 2 12 2z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z"/></svg>',
};

// column/ など下の階層のページは <html data-base="../"> を付けると、リンクが正しく組み立てられます
const BASE = document.documentElement.dataset.base || "";
const link = h => /^(https?:|mailto:|tel:)/.test(h) ? h : BASE + h;
const isHere = (h, here) => h.startsWith("column/") ? location.pathname.includes("/column/") : h === here;

const telHref = n => "tel:" + n.replace(/[^\d+]/g, "");

function renderChrome(){
  const here = location.pathname.split("/").pop() || "index.html";
  const header = document.getElementById("site-header");
  if (header) header.innerHTML = `
    <div class="container">
      <a class="brand" href="${link("index.html")}"><img src="${link("assets/img/sitelogo.webp")}" alt="DAIZEN" width="76" height="40"><span>ハウスクリーニング<br>白金台・創業1984年</span></a>
      <button class="menu-toggle" aria-label="メニュー" aria-expanded="false" aria-controls="gnav">${ICON.menu}</button>
      <nav class="gnav" id="gnav">
        ${NAV.map(([h, t]) => `<a href="${link(h)}"${isHere(h, here) ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
        <a class="btn btn-gold btn-sm" href="${link("booking.html")}">${ICON.cal}かんたん予約</a>
      </nav>
    </div>`;

  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = `
    <div class="container">
      <div class="cols">
        <div>
          <img src="${link("assets/img/sitelogo.webp")}" alt="DAIZEN" width="120" height="64" style="border-radius:10px">
          <p style="margin:14px 0 4px">${SITE.company}</p>
          <p style="margin:0">${SITE.address}</p>
          <div class="sns">
            <a href="${SITE.sns.instagram}" aria-label="Instagram" target="_blank" rel="noopener">${ICON.instagram}</a>
            <a href="${SITE.sns.x}" aria-label="X" target="_blank" rel="noopener">${ICON.x}</a>
            <a href="${SITE.sns.facebook}" aria-label="Facebook" target="_blank" rel="noopener">${ICON.facebook}</a>
          </div>
        </div>
        <div>
          <h4>MENU</h4>
          <ul>${NAV.map(([h, t]) => `<li><a href="${link(h)}">${t}</a></li>`).join("")}<li><a href="${link("booking.html")}">かんたん予約</a></li></ul>
        </div>
        <div>
          <h4>CONTACT</h4>
          <ul>
            <li>TEL <a href="${telHref(SITE.tel)}">${SITE.tel}</a></li>
            <li>携帯 <a href="${telHref(SITE.mobile)}">${SITE.mobile}</a></li>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li>受付 ${SITE.hours}</li>
            <li><a href="${SITE.ekiten}" target="_blank" rel="noopener">エキテンからも予約できます ↗</a></li>
          </ul>
        </div>
      </div>
      <div class="copy"><span>© ${new Date().getFullYear()} ${SITE.company}（DAIZEN）</span><a href="${link("index.html#law")}">特定商取引法に基づく表記</a></div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="fixed-cta">
      <a class="tel" href="${telHref(SITE.mobile)}">${ICON.tel}電話する</a>
      <a class="book" href="${link("booking.html")}">${ICON.cal}料金を見て予約</a>
    </div>`);

  // data-site="tel" などを連絡先で埋める
  document.querySelectorAll("[data-site]").forEach(el => {
    const k = el.dataset.site, v = SITE[k]; if (!v) return;
    el.textContent = v;
    if (el.tagName === "A") el.href = k === "email" ? "mailto:" + v : (k === "tel" || k === "mobile") ? telHref(v) : v;
  });

  const btn = document.querySelector(".menu-toggle"), nav = document.getElementById("gnav");
  if (btn) {
    btn.onclick = () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o); };
    nav.addEventListener("click", e => { if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", false); } });
  }
}

// スクロールでふわっと表示
function setupReveal(){
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin:"0px 0px -10% 0px" });
  els.forEach(e => io.observe(e));
}

// data-until="2026-10-31" の要素は期限を過ぎたら自動で非表示（キャンペーン用）
function hideExpired(){
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll("[data-until]").forEach(el => { if (today > el.dataset.until) el.remove(); });
}

// Google口コミの評価・件数を最新にする（data-review="rating" / "count" の要素）
// 取得できない場合は HTML に書いてある数字のまま表示します。
async function loadReviews(){
  const els = document.querySelectorAll("[data-review]");
  if (!els.length || !SITE.gasUrl) return;
  try {
    const res = await fetch(SITE.gasUrl + "?reviews=1");
    const r = await res.json();
    if (!r || !r.rating || !r.count) return;
    els.forEach(el => {
      const v = el.dataset.review === "rating" ? Number(r.rating).toFixed(1) : String(r.count);
      el.textContent = el.dataset.review === "count" ? Number(r.count).toLocaleString() : v;
      if (el.dataset.count) el.dataset.count = v;
    });
  } catch (e) { /* 通信できないときは既定の数字のまま */ }
}

renderChrome();
hideExpired();
loadReviews();
setupReveal();
