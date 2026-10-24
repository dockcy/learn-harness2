/* 第二段：照老样子跑两趟（路书上的蹄印）→ 两位匠人各改一样 → 各试跑一趟 → 老周拼成一副 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const K = VKit, CH = (window.CH = window.CH || {}), C = CH.C, T = CH.T;

/* 一趟：从 x0 走到 x1（t0 → t1）。返回 { x, k（0…1）, ph（步态相位）} */
const run = (t, t0, t1, x0, x1) => { const k = seg(t, t0, t1); return { k, x: lerp(x0, x1, k), ph: (Math.min(t, t1) - t0) * 7.6, on: t >= t0 - .3 }; };
CH.run = run;

/* 4 · 两趟老样子：顶上路书，下面马跑。第一趟在石子处绊一下（灰点），两趟都在冰坡滑倒（红 ×） */
const R1 = [33.4, 37.2], R2 = [38.6, 42.2], XA = -100, XI = 1152, PEB = 560;
CH.S4 = { R1, R2, stumble: (PEB - 60 - XA) / (XI - XA) * CH.ICE };
CH.s4 = function (fr, t) {
  CH.snowRoad(fr, t, { ice: 1260, pebble: PEB });
  const one = (r, stumble) => {
    const q = run(t, r[0], r[1], XA, XI), sl = E.out3(seg(t, r[1], r[1] + .45)), x = q.x + 60 * E.out3(seg(t, r[1], r[1] + .8));
    const sf = (PEB - 60 - XA) / (XI - XA), st = stumble ? Math.sin(Math.PI * clamp((q.k - sf) / .07)) : 0;
    return { q, sl, x, st, sf };
  };
  const a1 = one(R1, 1), a2 = one(R2, 0);
  const v1 = ss(t, R1[0] - .2, R1[0]) * (1 - ss(t, R2[0] - .6, R2[0] - .2)), v2 = ss(t, R2[0] - .2, R2[0]);
  if (v1 > 0) { CH.horse(fr, a1.x, 772, .9, { a: v1, walk: a1.q.ph, slip: a1.sl, tilt: .07 * a1.st, neck: .25 * a1.st }); CH.spray(fr, t, R1[1], a1.x + 90, 770); if (a1.st > .2) CH.spray(fr, t, R1[0] + a1.sf * (R1[1] - R1[0]) + .1, PEB, 776, 6, '#9A948A'); }
  if (v2 > 0) { CH.horse(fr, a2.x, 772, .9, { a: v2, walk: a2.q.ph, slip: a2.sl }); CH.spray(fr, t, R2[1], a2.x + 90, 770); }
  /* 路书 */
  const ICE = CH.ICE, sf = a1.sf;
  const geo = CH.strip(fr, t, { a: ss(t, 32.4, 33.0), rows: [
    { label: '第一趟', k: a1.q.k * ICE + (t > R1[1] ? .01 : 0), fail: 1, stumble: t > R1[0] + sf * (R1[1] - R1[0]) ? sf * ICE : null },
    { label: '第二趟', k: a2.q.k * ICE + (t > R2[1] ? .01 : 0), fail: 1, a: ss(t, R2[0] - .4, R2[0]) },
  ] });
  /* 金圈：两个 × 在同一处 */
  const ra = ss(t, 43.7, 44.2), cx = geo.RX(ICE) + 10, cy = (geo.rowY(0) + geo.rowY(1)) / 2;
  CH.ring(fr, cx, cy, 44, 52, ra);
  if (ra > 0) fr.text('同一处', cx + 112, cy + 2, { font: 'sans', size: 30, color: C.gold2, a: ra });
  /* 灰圈：只出现一回 */
  const ga = ss(t, 47.5, 48.0), gx = geo.RX(sf * ICE);
  CH.ring(fr, gx, geo.rowY(0), 26, 26, ga, C.grey);
  if (ga > 0) fr.text('只一回', gx, geo.rowY(0) + 104, { font: 'sans', size: 30, color: '#6E6A62', a: ga });
  if (ga > 0) fr.line(gx, geo.rowY(0) + 28, gx, geo.rowY(0) + 74, { w: 3, color: C.grey, a: ga });
};

/* 5 · 作坊：两副马具架。铜匠敲防滑钉、挂铃铛；银匠写路签，放大给观众看，再系上 */
const HITS = [59.2, 59.7, 60.2, 60.7], BELL = 61.3, SLIP = [65.9, 67.6, 68.3];
CH.S5 = { HITS, BELL, SLIP };
CH.s5 = function (fr, t) {
  CH.room(fr, t, 'shop');
  const LX = 640, RX = 1280, GY = 800, S = 1.15;
  const sp = HITS.reduce((m, h) => m + (t >= h ? .25 : 0), 0), bell = E.outBack(ss(t, BELL, BELL + .35));
  const fly = E.io3(seg(t, SLIP[1], SLIP[2]));
  CH.stand(fr, LX, GY, S, { items: { spikes: sp, bell } });
  CH.stand(fr, RX, GY, S, { items: { slip: t >= SLIP[2] ? 1 : 0 } });
  /* 铜匠：举锤 → 落锤（每一下对着一枚蹄铁） */
  let arm = .5; HITS.forEach(h => { const k = seg(t, h - .3, h); if (k > 0 && k < 1) arm = lerp(2.3, .95, E.in2(k)); else if (t >= h && t < h + .2) arm = lerp(.95, 1.6, seg(t, h, h + .2)); });
  if (t > 58.4 && t < HITS[0] - .3) arm = lerp(.5, 2.3, ss(t, 58.4, HITS[0] - .3));
  if (t > BELL - .4 && t < BELL + .4) arm = 1.5;
  const look = ss(t, 51.6, 52.2) * (1 - ss(t, 54.6, 55.2));
  CH.person(fr, LX - 230, GY, 1.25, { role: 'copper', arm, nod: -.3 * look, hold: CH.hammer2 });
  HITS.forEach((h, i) => { const k = seg(t, h, h + .4); if (k > 0 && k < 1) for (let j = 0; j < 8; j++) { const u = -Math.PI * hash(j + i * 9), r = 20 + 70 * k; fr.circle(LX + (-60 + i * 40) * S + Math.cos(u) * r, GY - 78 * S + Math.sin(u) * r, 4, { fill: '#FFD27A', a: 1 - k }); } });
  /* 银匠：写路签 */
  const writing = t > 62.4 && t < SLIP[0];
  CH.person(fr, RX + 230, GY, 1.25, { role: 'silver', dir: -1, arm: writing ? .9 + Math.sin(t * 6) * .12 : (t > SLIP[1] && t < SLIP[2] + .3 ? 1.4 : .3), nod: -.3 * look + (writing ? .18 : 0), hold: CH.brush });
  /* 标签 */
  const la = ss(t, 55.2, 55.7), lb = ss(t, 62.2, 62.7);
  CH.label(fr, '铜匠 · 改走法', LX, 400, { color: C.copper2, l2: '哪条路都用得上', a: la });
  CH.label(fr, '银匠 · 补门道', RX, 400, { color: C.silver2, l2: '只管雪岭这片山', a: lb });
  /* 大路签：先放大给人看，再飞到架子左端系上 */
  const big = ss(t, SLIP[0], SLIP[0] + .4) * (t < SLIP[2] ? 1 : 0);
  if (big > 0) {
    const tx = RX - 100 * S, ty = GY - 206 * S + 45 * S, x = lerp(960, tx, fly), y = lerp(600, ty, fly), s = lerp(1, .12, fly) * E.outBack(big);
    fr.g({ at: [x, y], s, rot: lerp(-.02, 0, fly) }, () => {
      fr.rect(-172, -150, 352, 300, { r: 4, fill: '#000000', a: .2 }); fr.rect(-180, -160, 360, 300, { r: 4, fill: C.slipPaper });
      fr.text('第三道弯', 0, -70, { font: 'sansh', size: 64, color: C.ink, track: 6 });
      fr.text('贴山壁走', 0, 40, { font: 'sansh', size: 64, color: C.ink, track: 6 });
    });
  }
  /* 路书挂在墙上：两个 × 还在 */
  const sa = 1;
  CH.strip(fr, t, { a: sa * .96, rows: [{ label: '第一趟', k: 1, fail: 1, stumble: CH.S4.stumble }, { label: '第二趟', k: 1, fail: 1 }] });
};

/* 6 · 试跑：铜匠版踩着防滑钉过冰；银匠版贴着山壁绕开冰。路书两行都走到终点打勾 */
const PA = [69.9, 72.5], PB = [72.8, 75.4];
CH.S6 = { PA, PB };
CH.s6 = function (fr, t) {
  CH.snowRoad(fr, t, { ice: 1260, wall: true });
  const a = run(t, PA[0], PA[1], 200, 2100), b = run(t, PB[0], PB[1], 200, 2100);
  if (t < PB[0] - .1) { CH.horse(fr, a.x, 772, .9, { walk: a.ph, items: { spikes: 1, bell: 1 } }); if (a.x > 1100 && a.x < 1420) CH.spray(fr, t, PA[0] + (1180 - 200) / 1900 * (PA[1] - PA[0]), 1240, 770, 12, '#E9F5FA'); }
  else CH.horse(fr, b.x, 712, .8, { walk: b.ph, items: { slip: 1 } });
  const ca = ss(t, 70.6, 71.0) * (1 - ss(t, PA[1] - .1, PA[1] + .2)), cb = ss(t, 73.4, 73.8) * (1 - ss(t, PB[1] - .1, PB[1] + .2));
  CH.callout(fr, a.x + 60, 780, a.x - 140, 820, '防滑钉', ca, { size: 32 });
  CH.callout(fr, b.x + 20, 560, b.x - 160, 470, '贴着山壁', cb, { size: 32 });
  CH.strip(fr, t, { rows: [
    { label: '铜匠版', color: C.copper2, k: a.k, done: 1 },
    { label: '银匠版', color: C.silver2, k: b.k, done: 1, wall: 1, a: ss(t, PB[0] - .5, PB[0]) },
  ] });
};

/* 7 · 拼合：两边两副、中间一副空架。防滑钉、路签各拉一根金线到路书上起作用的那一刻，再飞到中间；
 * 铃铛的线找不到落点 → 红 × → 掉进筐里 */
const TH = { sp: [79.8, 80.7, 81.5], sl: [81.0, 81.9, 82.7], bl: [83.4, 84.2, 84.6, 85.4] };
CH.S7 = TH;
CH.s7 = function (fr, t) {
  CH.room(fr, t, 'shop');
  const GY = 800, LX = 330, MX = 960, RX = 1590, s = .95, S = 1.1;
  const geo = CH.strip(fr, t, { rows: [{ label: '铜匠版', color: C.copper2, k: 1, done: 1 }, { label: '银匠版', color: C.silver2, k: 1, done: 1, wall: 1 }] });
  const spGo = E.io3(seg(t, TH.sp[1], TH.sp[2])), slGo = E.io3(seg(t, TH.sl[1], TH.sl[2]));
  const blX = ss(t, TH.bl[1], TH.bl[1] + .25), blDrop = E.in2(seg(t, TH.bl[2], TH.bl[3]));
  /* 筐 */
  fr.path('M 100,800 L 120,700 L 280,700 L 300,800 Z', { fill: '#9A7444' }); for (let i = 0; i < 4; i++) fr.line(112 + i * 4, 722 + i * 24, 288 - i * 4, 722 + i * 24, { w: 3, color: '#7A5A34' });
  CH.stand(fr, LX, GY, s, { items: { spikes: 1 - spGo, bell: blDrop > 0 ? 0 : 1 }, label: '', a: 1 });
  CH.stand(fr, RX, GY, s, { items: { slip: slGo > 0 ? 0 : 1 } });
  const ma = E.outBack(ss(t, 76.3, 76.8));
  CH.stand(fr, MX, GY, S * ma, { items: { spikes: t >= TH.sp[2] ? 1 : 0, slip: t >= TH.sl[2] ? 1 : 0 }, glow: { all: ss(t, 85.2, 85.6) * (1 - ss(t, 86.0, 86.4)) } });
  CH.label(fr, '铜匠版', LX, 470, { size: 32, color: C.copper2 }); CH.label(fr, '银匠版', RX, 470, { size: 32, color: C.silver2 });
  CH.label(fr, '拼成的一副', MX, 440, { size: 40, a: ss(t, 76.6, 77.1) });
  CH.person(fr, 1260, GY, 1.05, { role: 'zhou', dir: -1, arm: t > TH.sp[0] && t < TH.bl[3] ? 1.3 : .2, nod: -.15 * ss(t, 79.5, 80) });
  /* 金线：从改动拉到路书上那一刻 */
  const thread = (x0, y0, x1, y1, k, col, a) => { if (k <= 0 || a <= 0) return; const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([lerp(x0, x1, u) + Math.sin(u * Math.PI) * 60, lerp(y0, y1, u)]); } fr.poly(pts, { color: col, w: 5, k, a }); if (k >= 1) fr.circle(x1, y1, 10, { fill: col, a }); };
  const ICE = CH.ICE, ix = geo.RX(ICE) + 10;
  const spA = ss(t, TH.sp[0], TH.sp[0] + .2) * (1 - ss(t, TH.bl[0], TH.bl[0] + .3));
  thread(LX, GY - 80 * s, ix, geo.rowY(0) + 12, E.out3(seg(t, TH.sp[0], TH.sp[0] + .8)), C.gold2, spA);
  thread(RX - 100 * s, GY - 160 * s, ix, geo.rowY(1) - 6, E.out3(seg(t, TH.sl[0], TH.sl[0] + .8)), C.gold2, ss(t, TH.sl[0], TH.sl[0] + .2) * (1 - ss(t, TH.bl[0], TH.bl[0] + .3)));
  /* 飞过去的防滑钉、路签 */
  if (spGo > 0 && spGo < 1) { const x = lerp(LX, MX, spGo), y = lerp(GY - 78 * s, GY - 78 * S, spGo) - Math.sin(spGo * Math.PI) * 140; CH.horseshoe(fr, x, y, 1.3, { spikes: 1 }); }
  if (slGo > 0 && slGo < 1) { const x = lerp(RX - 100 * s, MX - 100 * S, slGo), y = lerp(GY - 160 * s, GY - 160 * S, slGo) - Math.sin(slGo * Math.PI) * 140; fr.rect(x - 16, y - 28, 32, 58, { r: 2, fill: C.slipPaper }); }
  /* 铃铛：线往上找，找不到 */
  const bx = LX + 98 * s, by0 = GY - 170 * s, bk = E.out3(seg(t, TH.bl[0], TH.bl[0] + .7)), ba = 1 - ss(t, TH.bl[2], TH.bl[2] + .2);
  if (bk > 0 && ba > 0) { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([bx + Math.sin(u * 9) * 40 * u + u * 220, by0 - u * 300]); } fr.poly(pts, { color: C.grey, w: 4, k: bk, a: ba, dash: [10, 10] }); if (bk > .95) fr.text('？', bx + 220, by0 - 330, { font: 'sansh', size: 54, color: '#6E6A62', a: ba }); }
  CH.cross(fr, bx, by0 + 30, 1.4, blX * (1 - ss(t, TH.bl[2], TH.bl[2] + .3)));
  if (blDrop > 0 && blDrop < 1) { const x = lerp(bx, 200, blDrop), y = lerp(by0 + 20, 730, blDrop) - Math.sin(blDrop * Math.PI) * 80; fr.g({ at: [x, y], rot: blDrop * 3 }, () => { fr.path('M -14,22 Q -13,0 0,0 Q 13,0 14,22 Z', { fill: C.gold2 }); fr.circle(0, 24, 4, { fill: C.ink }); }); }
  if (blDrop >= 1) fr.g({ at: [205, 704] }, () => { fr.path('M -14,0 Q -13,-22 0,-22 Q 13,-22 14,0 Z', { fill: C.gold2 }); });
};
})();
