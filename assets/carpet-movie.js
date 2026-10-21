// ============================================================
// DAIZEN カーペットクリーニング ムービー（縦型 9:16 / 約32秒）
// <canvas> にリアルタイム描画します。録画ボタンで動画ファイルにも書き出せます。
// 使い方: CarpetMovie.mount(document.querySelector(".carpet-movie"))
// ============================================================
(function(){
const W = 720, H = 1280;              // 内部解像度（縦型・SNS/Googleビジネス向け）
const DUR = 32;                        // 全体の長さ（秒）
const CARPET = { x:60, y:330, w:600, h:640, r:28 };
const PRICE = [["6畳", "32,000円"], ["8畳", "38,000円"], ["12畳", "43,000円"]];
const TEL = "03-3442-5646";

// シーン（開始秒, 終了秒）
const S = {
  intro:  [0, 3.2],
  dirty:  [3.2, 7.5],
  polish: [7.5, 12],
  encap:  [12, 15.5],
  rinse:  [15.5, 21.5],
  dry:    [21.5, 24.5],
  ba:     [24.5, 28.5],
  outro:  [28.5, DUR],
};

// ---------- 小道具 ----------
const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b, v));
const prog = (t, [a, b]) => clamp((t - a) / (b - a));
const ease = x => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const inScene = (t, [a, b]) => t >= a && t < b;
function rng(seed){ return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const SANS = '"Noto Sans JP","Hiragino Sans","Yu Gothic",sans-serif';
const SERIF = '"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho",serif';

// ---------- カーペットの質感を事前に生成 ----------
function weave(ctx, w, h, base, seed, sat){
  const r = rng(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++){            // 毛足（短い線を大量に）
    const x = r()*w, y = r()*h, l = 3 + r()*5, a = r()*Math.PI*2;
    const L = 22 + r()*22;
    ctx.strokeStyle = `hsla(${352 + r()*10},${sat}%,${L}%,.55)`;
    ctx.lineWidth = 1 + r()*1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); ctx.stroke();
  }
  const g = ctx.createRadialGradient(w*.4, h*.35, 50, w*.5, h*.5, w*.9);  // 柔らかな光
  g.addColorStop(0, "rgba(255,255,255,.10)"); g.addColorStop(1, "rgba(0,0,0,.25)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function buildTextures(){
  const { w, h } = CARPET;
  const clean = mk(w, h), dirty = mk(w, h);
  weave(clean.getContext("2d"), w, h, "#b3121f", 7, 82);
  const d = dirty.getContext("2d");
  weave(d, w, h, "#7c2a26", 7, 40);
  const r = rng(99);
  d.fillStyle = "rgba(90,70,50,.35)"; d.fillRect(0, 0, w, h);           // くすみ
  for (let i = 0; i < 9; i++){                                          // シミ
    const x = r()*w, y = r()*h, R = 30 + r()*70;
    d.save(); d.translate(x, y); d.rotate(r()*3); d.scale(1, .5 + r()*.6);
    const g = d.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, "rgba(60,40,20,.55)"); g.addColorStop(.7, "rgba(70,50,30,.35)"); g.addColorStop(1, "rgba(70,50,30,0)");
    d.fillStyle = g; d.beginPath(); d.arc(0, 0, R, 0, 7); d.fill(); d.restore();
  }
  for (let i = 0; i < 1400; i++){                                       // ホコリ
    d.fillStyle = `rgba(${200 + r()*40},${190 + r()*40},${170 + r()*40},${.25 + r()*.4})`;
    d.fillRect(r()*w, r()*h, 1.5 + r()*2, 1.5 + r()*2);
  }
  d.lineWidth = 1.2;                                                    // 毛（髪・ペットの毛）
  for (let i = 0; i < 70; i++){
    d.strokeStyle = r() > .5 ? "rgba(30,25,20,.6)" : "rgba(230,220,200,.55)";
    const x = r()*w, y = r()*h;
    d.beginPath(); d.moveTo(x, y); d.bezierCurveTo(x + r()*40 - 20, y + r()*40 - 20, x + r()*60 - 30, y + r()*60 - 30, x + r()*70 - 35, y + r()*70 - 35); d.stroke();
  }
  return { clean, dirty };
}

// 往復（ジグザグ）の経路上の位置を返す
function serpentine(p, rows, pad){
  const { w, h } = CARPET;
  const row = Math.min(rows - 1, Math.floor(p * rows));
  const f = p * rows - row;
  const x = row % 2 ? (w - pad) - f*(w - pad*2) : pad + f*(w - pad*2);
  const y = pad + row * ((h - pad*2) / (rows - 1));
  return [x, y];
}

// ---------- テキスト系 ----------
function text(ctx, s, x, y, { size=40, weight=700, color="#fff", font=SANS, align="center", alpha=1, spacing=0 } = {}){
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) ctx.letterSpacing = spacing + "px";
  ctx.fillText(s, x, y); ctx.restore();
}
function pill(ctx, x, y, w, h, fill){
  ctx.beginPath(); ctx.roundRect(x - w/2, y - h/2, w, h, h/2); ctx.fillStyle = fill; ctx.fill();
}
function stepBadge(ctx, n, title, sub, t, sc){
  const p = prog(t, sc), a = clamp(p * 6) * clamp((1 - p) * 8);
  const yy = 150 + (1 - easeOut(clamp(p*4))) * 30;
  ctx.save(); ctx.globalAlpha = a;
  pill(ctx, W/2, yy - 60, 170, 46, "#d9a441");
  text(ctx, `STEP ${n}`, W/2, yy - 59, { size:24, weight:800, spacing:4 });
  text(ctx, title, W/2, yy + 10, { size:46, weight:800 });
  text(ctx, sub, W/2, yy + 70, { size:26, weight:500, color:"#b9c8d3" });
  ctx.restore();
}

// ---------- 本体 ----------
function create(canvas){
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const tex = buildTextures();
  const cur = mk(CARPET.w, CARPET.h), cctx = cur.getContext("2d");
  const foam = mk(CARPET.w, CARPET.h), fctx = foam.getContext("2d");
  const logo = new Image(); logo.src = (canvas.dataset.logo || "assets/img/sitelogo.webp");
  const r = rng(3);
  const bubbles = Array.from({ length:70 }, () => ({ x:r()*CARPET.w, y:r()*CARPET.h, s:8 + r()*22, d:r() }));
  const motes = Array.from({ length:60 }, () => ({ x:r()*CARPET.w, y:r()*CARPET.h, v:.3 + r(), d:r() }));
  let lastPolish = 0, lastRinse = 0;

  function reset(){
    cctx.globalCompositeOperation = "source-over"; cctx.drawImage(tex.dirty, 0, 0);
    fctx.clearRect(0, 0, CARPET.w, CARPET.h);
    lastPolish = lastRinse = 0;
  }
  reset();

  // 前回フレームから今回までの経路を塗る（コマ落ちしても塗り残しが出ない）
  function sweep(from, to, rows, pad, fn){
    const steps = Math.max(1, Math.ceil((to - from) * 600));
    for (let i = 1; i <= steps; i++){ const [x, y] = serpentine(from + (to - from) * i / steps, rows, pad); fn(x, y); }
  }

  function drawCarpet(t){
    const { x, y, w, h, r:rad } = CARPET;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fillStyle = "#000"; ctx.fill();
    ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.clip();
    ctx.drawImage(cur, x, y);
    ctx.drawImage(foam, x, y);
    // 乾燥シーン：つや出しの光が走る
    if (t >= S.dry[0]){
      const p = prog(t, S.dry);
      const gx = x - 300 + p * (w + 600);
      const g = ctx.createLinearGradient(gx - 160, y, gx + 160, y + h);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, `rgba(255,255,255,${.28 * (1 - Math.abs(p - .5))})`); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  function polisher(px, py, t){
    const { x, y } = CARPET, cx = x + px, cy = y + py, a = t * 22;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(6, 10, 92, 92, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#8b3a8f"; ctx.beginPath(); ctx.arc(0, 0, 88, 0, 7); ctx.fill();              // 紫のパッドカバー
    ctx.strokeStyle = "#5e2463"; ctx.lineWidth = 6; ctx.stroke();
    ctx.rotate(a);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.arc(0, 0, 60, 0, .7); ctx.stroke(); }
    ctx.rotate(-a);
    const g = ctx.createRadialGradient(-12, -12, 4, 0, 0, 44); g.addColorStop(0, "#e6eaee"); g.addColorStop(1, "#8b949c");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fill();                       // モーター
    ctx.strokeStyle = "#cfd6dc"; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 260); ctx.stroke();                            // ハンドル
    ctx.restore();
  }

  function rinser(px, py){
    const { x, y } = CARPET, cx = x + px, cy = y + py;
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(-78, -10, 160, 30);
    const g = ctx.createLinearGradient(0, -22, 0, 22); g.addColorStop(0, "rgba(220,240,255,.85)"); g.addColorStop(1, "rgba(150,190,215,.85)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-80, -20, 160, 34, 10); ctx.fill();          // 透明ノズル
    ctx.fillStyle = "rgba(110,80,50,.8)"; ctx.fillRect(-70, -8, 140 * (.4 + .6 * Math.random()), 10); // ノズル内を流れる汚水
    ctx.strokeStyle = "#cfd6dc"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -240); ctx.stroke();
    ctx.restore();
  }

  function tank(level, alpha){
    const tx = 560, ty = 470, tw = 120, th = 300;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(13,26,38,.75)"; ctx.beginPath(); ctx.roundRect(tx - 14, ty - 60, tw + 28, th + 120, 20); ctx.fill();
    text(ctx, "汚水タンク", tx + tw/2, ty - 30, { size:22, weight:700 });
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 16); ctx.fillStyle = "rgba(200,225,240,.18)"; ctx.fill();
    ctx.save(); ctx.clip();
    const lh = th * level, wave = Math.sin(performance.now() / 180) * 4;
    const g = ctx.createLinearGradient(0, ty + th - lh, 0, ty + th);
    g.addColorStop(0, "#8a6a3e"); g.addColorStop(1, "#3e2a14");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx, ty + th - lh + wave);
    ctx.quadraticCurveTo(tx + tw/2, ty + th - lh - wave, tx + tw, ty + th - lh + wave); ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx, ty + th); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 16); ctx.stroke();
    text(ctx, Math.round(level * 100) + "%", tx + tw/2, ty + th + 32, { size:26, weight:800, color:"#d9a441" });
    ctx.restore();
  }

  function background(){
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0d1a26"); g.addColorStop(1, "#1d3446");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function frame(t){
    if (t < 0.05) reset();
    background();
    const { x:cx0, y:cy0, w:cw, h:ch } = CARPET;

    // --- オープニング ---
    if (inScene(t, S.intro)){
      const p = prog(t, S.intro), a = clamp(p * 4) * clamp((1 - p) * 5);
      ctx.save(); ctx.globalAlpha = a;
      if (logo.complete && logo.naturalWidth){
        const lw = 420, lh = lw * logo.naturalHeight / logo.naturalWidth;
        ctx.save(); ctx.beginPath(); ctx.roundRect(W/2 - lw/2, 380, lw, lh, 24); ctx.clip();
        ctx.drawImage(logo, W/2 - lw/2, 380 + (1 - easeOut(clamp(p*3))) * 30, lw, lh); ctx.restore();
      }
      text(ctx, "神は細部に宿る", W/2, 720, { size:58, font:SERIF, spacing:10 });
      text(ctx, "CARPET CLEANING", W/2, 800, { size:28, weight:600, color:"#d9a441", spacing:10 });
      text(ctx, "プロのカーペット洗浄、その全工程。", W/2, 880, { size:30, weight:500, color:"#b9c8d3" });
      ctx.restore();
      return;
    }

    // --- 汚れたカーペット ---
    drawCarpet(t);
    if (inScene(t, S.dirty)){
      const p = prog(t, S.dirty);
      text(ctx, "その床、", W/2, 140, { size:44, alpha:clamp(p*5) });
      text(ctx, "見た目以上に汚れています。", W/2, 205, { size:44, alpha:clamp(p*5 - .5) });
      const tags = [["ダニ", 150, 520], ["ホコリ", 470, 450], ["ニオイ", 210, 790], ["ペット汚れ", 470, 860]];
      tags.forEach(([s, x, y], i) => {
        const a = clamp(p * 5 - 1 - i * .5);
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(.8 + .2 * easeOut(a), .8 + .2 * easeOut(a));
        pill(ctx, 0, 0, s.length * 34 + 50, 64, "rgba(13,26,38,.85)");
        ctx.strokeStyle = "#d9a441"; ctx.lineWidth = 2; ctx.stroke();
        text(ctx, s, 0, 2, { size:30 }); ctx.restore();
      });
      // 拡大鏡
      const a = clamp(p * 4 - 2);
      if (a > 0){
        ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(360, 660, 110, 0, 7); ctx.clip();
        ctx.drawImage(tex.dirty, 300 - 55, 330 - 55, 110, 110, 250, 550, 220, 220); ctx.restore();
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(360, 660, 110, 0, 7); ctx.stroke();
        ctx.lineCap = "round"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(440, 740); ctx.lineTo(510, 810); ctx.stroke(); ctx.restore();
      }
    }

    // --- STEP1 ポリッシャー ---
    if (inScene(t, S.polish)){
      const p = ease(prog(t, S.polish));
      sweep(lastPolish, p, 4, 90, (x, y) => {
        fctx.fillStyle = "rgba(255,255,255,.014)";
        for (let k = 0; k < 3; k++){ fctx.beginPath(); fctx.arc(x + (Math.random() - .5) * 120, y + (Math.random() - .5) * 120, 12 + Math.random() * 26, 0, 7); fctx.fill(); }
        cctx.globalAlpha = .03; cctx.drawImage(tex.clean, x - 90, y - 90, 180, 180, x - 90, y - 90, 180, 180); cctx.globalAlpha = 1;
      });
      lastPolish = p;
      const [x, y] = serpentine(p, 4, 90);
      polisher(x, y, t);
      stepBadge(ctx, 1, "ポリッシャー洗浄", "回転ブラシで繊維の奥から汚れを浮かせる", t, S.polish);
    }

    // --- STEP2 カプセル化 ---
    if (inScene(t, S.encap)){
      const p = prog(t, S.encap);
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, CARPET.r); ctx.clip();
      bubbles.forEach(b => {
        const a = clamp(p * 3 - b.d * 1.5), s = b.s * easeOut(a);
        if (s <= 0) return;
        const bx = cx0 + b.x, by = cy0 + b.y - p * 40 * b.d;
        ctx.fillStyle = "rgba(110,80,50,.8)"; ctx.beginPath(); ctx.arc(bx, by, s * .35, 0, 7); ctx.fill();   // 閉じ込められた汚れ
        const g = ctx.createRadialGradient(bx - s*.3, by - s*.3, 1, bx, by, s);
        g.addColorStop(0, "rgba(255,255,255,.7)"); g.addColorStop(.6, "rgba(200,230,255,.15)"); g.addColorStop(1, "rgba(255,255,255,.45)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, s, 0, 7); ctx.fill();
      });
      ctx.restore();
      stepBadge(ctx, 2, "汚れをカプセル化", "ドイツ製専用洗剤が汚れを包み込み、繊維から引き離す", t, S.encap);
    }

    // --- STEP3 リンサー吸引 ---
    if (inScene(t, S.rinse)){
      const p = ease(prog(t, S.rinse));
      sweep(lastRinse, p, 6, 60, (x, y) => {
        cctx.save(); cctx.beginPath(); cctx.rect(x - 85, y - 70, 170, 140); cctx.clip(); cctx.drawImage(tex.clean, 0, 0); cctx.restore();
        fctx.clearRect(x - 85, y - 70, 170, 140);
      });
      lastRinse = p;
      const [x, y] = serpentine(p, 6, 60);
      rinser(x, y);
      tank(.08 + p * .82, clamp(prog(t, S.rinse) * 6) * clamp((1 - prog(t, S.rinse)) * 10));
      stepBadge(ctx, 3, "リンサーで水洗い吸引", "ドイツ製リンサーで、汚れを水流ごと吸い上げる", t, S.rinse);
    }

    // --- STEP4 乾燥 ---
    if (inScene(t, S.dry)){
      const p = prog(t, S.dry);
      ctx.save(); ctx.globalAlpha = clamp(p * 4) * clamp((1 - p) * 4);
      ctx.strokeStyle = "rgba(220,240,255,.6)"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let i = 0; i < 7; i++){
        const yy = cy0 + 80 + i * 85, off = ((t * 400 + i * 130) % (cw + 300)) - 150;
        ctx.beginPath(); ctx.moveTo(cx0 + off, yy); ctx.bezierCurveTo(cx0 + off + 60, yy - 20, cx0 + off + 120, yy + 20, cx0 + off + 180, yy); ctx.stroke();
      }
      motes.forEach(m => {                      // きらめき
        const a = Math.max(0, Math.sin((t * 3 + m.d * 6) * m.v * 2));
        ctx.fillStyle = `rgba(255,255,255,${a * .8})`;
        const sx = cx0 + m.x, sy = cy0 + m.y;
        ctx.beginPath(); ctx.moveTo(sx, sy - 9*a); ctx.lineTo(sx + 2, sy - 2); ctx.lineTo(sx + 9*a, sy); ctx.lineTo(sx + 2, sy + 2);
        ctx.lineTo(sx, sy + 9*a); ctx.lineTo(sx - 2, sy + 2); ctx.lineTo(sx - 9*a, sy); ctx.lineTo(sx - 2, sy - 2); ctx.fill();
      });
      ctx.restore();
      stepBadge(ctx, 4, "送風でしっかり乾燥", "空調と送風機で、すぐに歩ける状態へ", t, S.dry);
    }

    // --- ビフォー・アフター ---
    if (inScene(t, S.ba)){
      const p = prog(t, S.ba);
      const split = cx0 + cw * (0.5 + 0.38 * Math.sin(p * Math.PI * 2) * (1 - p * .6));
      ctx.save(); ctx.beginPath(); ctx.roundRect(cx0, cy0, cw, ch, CARPET.r); ctx.clip();
      ctx.drawImage(tex.dirty, cx0, cy0);
      ctx.beginPath(); ctx.rect(split, cy0, cw, ch); ctx.clip(); ctx.drawImage(tex.clean, cx0, cy0);
      ctx.restore();
      ctx.fillStyle = "#fff"; ctx.fillRect(split - 3, cy0, 6, ch);
      ctx.beginPath(); ctx.arc(split, cy0 + ch/2, 34, 0, 7); ctx.fill();
      text(ctx, "‹ ›", split, cy0 + ch/2 - 2, { size:30, weight:800, color:"#0d1a26" });
      pill(ctx, cx0 + 110, cy0 + 50, 160, 50, "rgba(13,26,38,.85)"); text(ctx, "BEFORE", cx0 + 110, cy0 + 51, { size:24, spacing:3 });
      pill(ctx, cx0 + cw - 110, cy0 + 50, 160, 50, "#d9a441"); text(ctx, "AFTER", cx0 + cw - 110, cy0 + 51, { size:24, spacing:3 });
      text(ctx, "新品よりも、美しく。", W/2, 170, { size:54, font:SERIF, alpha:clamp(p * 4), spacing:6 });
    }

    // --- エンディング（料金と予約） ---
    if (t >= S.outro[0]){
      const p = prog(t, S.outro);
      ctx.fillStyle = `rgba(13,26,38,${.82 * clamp(p * 4)})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = clamp(p * 4);
      text(ctx, "カーペットクリーニング 料金例", W/2, 360, { size:36 });
      PRICE.forEach(([k, v], i) => {
        const yy = 450 + i * 96, a = clamp(p * 6 - 1 - i * .5);
        ctx.save(); ctx.globalAlpha *= a;
        ctx.beginPath(); ctx.roundRect(110, yy - 38, 500, 76, 18); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fill();
        text(ctx, k, 170, yy, { size:32, align:"left" });
        text(ctx, v, 590, yy, { size:42, weight:800, color:"#d9a441", align:"right" });
        ctx.restore();
      });
      text(ctx, "ソファーも対応・ペットの粗相もおまかせ", W/2, 770, { size:26, weight:500, color:"#b9c8d3" });
      text(ctx, "※料金は目安です。素材・広さで変わります。", W/2, 812, { size:22, weight:400, color:"#8fa9ba" });
      pill(ctx, W/2, 920, 520, 100, "#d9a441");
      text(ctx, "TEL " + TEL, W/2, 922, { size:42, weight:800 });
      text(ctx, "DAIZEN  白金台・創業1984年", W/2, 1040, { size:28, weight:600, spacing:4 });
      ctx.restore();
    }
  }

  // ---------- 再生制御 ----------
  let start = null, playing = false, raf = 0, offset = 0;
  function loop(now){
    if (start === null) start = now - offset * 1000;
    let t = (now - start) / 1000;
    if (t >= DUR){ start = now; t = 0; reset(); if (player.onend) player.onend(); }
    offset = t;
    frame(t);
    raf = requestAnimationFrame(loop);
  }
  const player = {
    canvas, duration:DUR,
    play(){ if (playing) return; playing = true; start = null; raf = requestAnimationFrame(loop); },
    pause(){ playing = false; cancelAnimationFrame(raf); },
    restart(){ this.pause(); offset = 0; reset(); this.play(); },
    get playing(){ return playing; },
    drawStill(t){ reset(); for (let s = 0; s <= t; s += 1/30) frame(s); },   // 確認用（重い）
    poster(){ frame(S.ba[0] + 1.6); },                                        // ビフォーアフターの1コマ（軽い）
  };
  return player;
}

// ---------- 録画（動画ファイル書き出し） ----------
function pickMime(){
  const list = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return list.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
}
function record(player, onProgress){
  return new Promise((resolve, reject) => {
    const mime = pickMime();
    if (!mime || !player.canvas.captureStream) return reject(new Error("このブラウザは動画の書き出しに対応していません（PCのChromeをお使いください）"));
    const stream = player.canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:8e6 });
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => resolve({ blob:new Blob(chunks, { type:mime.split(";")[0] }), ext:mime.includes("mp4") ? "mp4" : "webm" });
    player.restart();
    rec.start(500);
    const t0 = performance.now();
    const tick = setInterval(() => onProgress && onProgress(Math.min(1, (performance.now() - t0) / 1000 / player.duration)), 250);
    player.onend = () => { player.onend = null; clearInterval(tick); rec.stop(); };
  });
}

// ---------- ページへの組み込み ----------
function mount(root){
  const canvas = root.querySelector("canvas");
  const playBtn = root.querySelector("[data-movie=play]");
  const recBtn = root.querySelector("[data-movie=record]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let player = null;
  // 質感の生成は重いので、画面に近づいてから作る
  const ensure = () => {
    if (!player){ player = create(canvas); player.poster(); }
    return player;
  };
  const setLabel = () => playBtn && (playBtn.textContent = player && player.playing ? "❚❚ 一時停止" : "▶ 再生");
  const ready = document.fonts ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    if (!("IntersectionObserver" in window)){ ensure(); return; }
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) ensure(); }), { rootMargin:"600px 0px" }).observe(canvas);
    if (reduced) return;
    // 画面に入ったら自動再生、外れたら停止
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && !root.dataset.userPaused) ensure().play(); else if (!e.isIntersecting && player) player.pause();
      setLabel();
    }), { threshold:.4 }).observe(canvas);
  });
  if (playBtn) playBtn.onclick = () => {
    const p = ensure();
    if (p.playing){ p.pause(); root.dataset.userPaused = "1"; } else { delete root.dataset.userPaused; p.play(); }
    setLabel();
  };
  if (recBtn) recBtn.onclick = async () => {
    ensure();
    recBtn.disabled = true;
    try {
      const { blob, ext } = await record(player, p => recBtn.textContent = `書き出し中… ${Math.round(p * 100)}%`);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `daizen-carpet-cleaning.${ext}`; a.click();
      recBtn.textContent = "✓ 保存しました（もう一度書き出す）";
    } catch (err){ alert(err.message); recBtn.textContent = "動画ファイルとして保存"; }
    recBtn.disabled = false;
    setLabel();
  };
  return player;
}

window.CarpetMovie = { create, mount, record, DURATION:DUR };
})();
