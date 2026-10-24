/* 第三段：拼两回得两副 → 隔帘只看包裹、写理由 → 写日志（按山分本）→ 下一单：先跑老样子，匠人先翻日志 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const K = VKit, CH = (window.CH = window.CH || {}), C = CH.C, T = CH.T;

/* 8a · 作坊：两副成品（第一副：防滑钉 + 路签；第二副：毛毡 + 路签），各送一趟，包裹回来 */
CH.s8a = function (fr, t) {
  CH.room(fr, t, 'shop');
  const GY = 800, LX = 640, RX = 1280, S = 1.15, p1 = E.outBack(ss(t, 87.1, 87.6)), p2 = E.outBack(ss(t, 88.5, 89.0));
  CH.stand(fr, LX, GY, S * p1, { items: { spikes: 1, slip: 1 } });
  CH.stand(fr, RX, GY, S * p2, { items: { felt: 1, slip: 1 } });
  CH.label(fr, '第一副', LX, 400, { l2: '防滑钉 + 路签', a: ss(t, 87.3, 87.8) });
  CH.label(fr, '第二副', RX, 400, { l2: '毛毡裹蹄 + 路签', a: ss(t, 88.7, 89.2) });
  /* 包裹送回来 */
  const q1 = E.outBack(ss(t, 91.0, 91.4)), q2 = E.outBack(ss(t, 91.6, 92.0));
  if (q1 > 0) CH.parcel(fr, LX + 230, GY, .8 * q1, {});
  if (q2 > 0) CH.parcel(fr, RX + 230, GY, .8 * q2, { wet: 1 });
};

/* 8b · 收发处：帘子把马具挡在左边，挑的人只看右边桌上的两个包裹（甲 = 第二副，乙 = 第一副，次序打乱）；
 * 写理由 → 乙盖金印 → 一根金线穿过帘子连回第一副 */
CH.s8b = function (fr, t) {
  CH.room(fr, t, 'hall');
  const GY = 790, S1 = [200, 1], S2 = [520, 1];
  CH.stand(fr, 200, GY, .85, { items: { spikes: 1, slip: 1 }, glow: { all: ss(t, 106.0, 106.5) } });
  CH.stand(fr, 520, GY, .85, { items: { felt: 1, slip: 1 } });
  CH.label(fr, '第一副', 200, 520, { size: 32 }); CH.label(fr, '第二副', 520, 520, { size: 32 });
  /* 挑的人在桌子后面 */
  const writing = t > 100.9 && t < 103.2;
  CH.person(fr, 1460, GY, 1.35, { role: 'judge', dir: -1, arm: writing ? .95 + Math.sin(t * 7) * .1 : .45, nod: .14, hold: writing ? CH.brush : null });
  fr.rect(1060, 610, 820, 28, { r: 4, fill: C.wood }); fr.rect(1100, 638, 26, 160, { fill: C.wood2 }); fr.rect(1814, 638, 26, 160, { fill: C.wood2 });
  /* 包裹穿过帘子：先在各自的架子前，过帘后换成「甲 / 乙」，左右也换了（甲 = 第二副，乙 = 第一副） */
  const go = E.io3(seg(t, 94.2, 96.0)), lab = ss(t, 97.6, 98.0), sealB = ss(t, 103.4, 103.6);
  const pA = [lerp(520 + 150, 1220, go), lerp(GY, 610, go)], pB = [lerp(200 + 150, 1720, go), lerp(GY, 610, go)];
  CH.parcel(fr, pA[0], pA[1] - Math.sin(go * Math.PI) * 40, lerp(.7, .95, go), { wet: 1, label: lab > .5 ? '甲' : null });
  CH.parcel(fr, pB[0], pB[1] - Math.sin(go * Math.PI) * 60, lerp(.7, .95, go), { label: lab > .5 ? '乙' : null, seal: sealB });
  /* 帘子：画在包裹前面（包裹从帘后穿过） */
  const CX = 760;
  fr.rect(CX - 20, 40, 260, 16, { r: 6, fill: C.wood2 });
  for (let i = 0; i < 5; i++) { const x = CX + i * 44, sw = Math.sin(t * 1.4 + i) * 3; fr.path(`M ${x},52 L ${x + 50},52 L ${x + 50 + sw},820 L ${x + sw},820 Z`, { fill: i % 2 ? '#3E5A4C' : '#476655' }); }
  CH.label(fr, '只看包裹', 1460, 300, { a: ss(t, 94.4, 94.9) * (1 - ss(t, 100.6, 100.9)) });
  /* 理由条 */
  const ra = ss(t, 101.1, 101.6);
  if (ra > 0) fr.g({ a: ra, at: [1460, 270], rot: -.017 }, () => {
    fr.rect(-300, -86, 600, 172, { r: 4, fill: '#000000', a: .18 }); fr.rect(-306, -94, 600, 172, { r: 4, fill: C.paper2 });
    for (let i = 0; i < 3; i++) fr.line(-280, -40 + i * 50, 270, -40 + i * 50, { w: 2, color: '#B9AE9A' });
    fr.chars('选乙：信是干的，封口完好', -6, -6, { font: 'sans', size: 40, color: C.ink }, i => ({ a: ss(t, 101.4 + i * .12, 101.6 + i * .12) }));
  });
  /* 金线：乙 ← 第一副（穿过帘子） */
  const gk = E.out3(seg(t, 106.0, 106.9));
  if (gk > 0) { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([lerp(1720, 200, u), lerp(470, 480, u) - Math.sin(u * Math.PI) * 60]); } fr.poly(pts, { color: C.gold2, w: 6, k: gk, dash: [16, 10] }); }
};

/* 9 · 书房：日志（米色卡片，略斜）。逐条记：防滑钉 有用、路签 有用、铃铛 没用；再写一条经验；
 * 合上，插回书架上写着「雪岭」的格子 */
const ENT = [112.0, 112.9, 113.8], LES = 115.6, SHELF = [119.4, 120.6];
CH.S9 = { ENT, LES, SHELF };
const vtext = (fr, str, x, y, o) => Array.from(str).forEach((c, i) => fr.text(c, x, y + i * o.size * 1.1, o));
CH.shelf = (fr, t, hi, slotA) => {
  fr.rect(160, 140, 520, 540, { fill: C.wood2 }); for (let i = 0; i < 3; i++) fr.rect(160, 300 + i * 190, 520, 18, { fill: C.wood });
  const books = [['雪岭', '#6E3B2E'], ['沙原', '#B0803A'], ['水乡', '#3F607A']];
  books.forEach(([name, col], i) => {
    const x = 240 + i * 150, y = 160, a = name === '雪岭' ? slotA : 1, dim = hi && name !== '雪岭' ? .5 : 1;
    fr.rect(x, y, 96, 140, { r: 4, fill: '#3A2A20', a: .6 });
    if (a > 0) fr.g({ a: a * dim }, () => { fr.rect(x, y, 96, 140, { r: 4, fill: col }); vtext(fr, name, x + 48, y + 44, { font: 'sansh', size: 34, color: '#FBF3E2' }); });
  });
  for (let r = 1; r < 3; r++) for (let i = 0; i < 6; i++) { const x = 190 + i * 78; fr.rect(x, 318 + (r - 1) * 190 + 22, 56, 150, { r: 3, fill: ['#7B5A3A', '#5F6B55', '#8A6A4A'][(i + r) % 3], a: .8 }); }
};
CH.s9 = function (fr, t) {
  CH.room(fr, t, 'study');
  const close = E.io3(seg(t, SHELF[0], SHELF[1])), inShelf = t >= SHELF[1];
  CH.shelf(fr, t, ss(t, 119.6, 120.2) * (1 - ss(t, 121.6, 122.2)), inShelf ? 1 : 0);
  CH.person(fr, 1790, 800, 1.0, { role: 'zhou', dir: -1, arm: t > 111.9 && t < 119 ? 1.0 + Math.sin(t * 6) * .1 : .3, nod: .15, hold: t > 111.9 && t < 119 ? CH.brush : null });
  /* 日志卡：合上时缩小、飞向书架 */
  const cx = lerp(1220, 288, close), cy = lerp(440, 230, close), s = lerp(1, .1, close), a = 1 - ss(t, SHELF[1] - .2, SHELF[1]);
  if (a > 0) fr.g({ at: [cx, cy], s, a, rot: -.017 }, () => {
    fr.rect(-452, -232, 920, 480, { r: 6, fill: '#000000', a: .2 }); fr.rect(-460, -240, 920, 480, { r: 6, fill: C.paper2 });
    fr.line(0, -230, 0, 230, { w: 3, color: '#B9AE9A' });
    for (let i = 0; i < 6; i++) { fr.line(-430, -120 + i * 64, -30, -120 + i * 64, { w: 2, color: '#C4B9A4' }); fr.line(30, -120 + i * 64, 430, -120 + i * 64, { w: 2, color: '#C4B9A4' }); }
    fr.text('雪岭 · 第一单', -230, -180, { font: 'sansh', size: 40, color: C.ink });
    [['防滑钉', '有用', 1], ['路签', '有用', 1], ['铃铛', '没用', 0]].forEach(([n, v, ok], i) => {
      const ea = ss(t, ENT[i], ENT[i] + .3), y = -88 + i * 96; if (ea <= 0) return;
      fr.text(n, -400, y, { font: 'sans', size: 40, color: C.ink, align: 'l', a: ea });
      fr.text(v, -110, y, { font: 'sans', size: 40, color: ok ? '#8A6A1E' : C.redInk, align: 'r', a: ea });
      if (ok) CH.tick(fr, -60, y, 1.1, ea); else CH.cross(fr, -60, y, 1, ea);
    });
    const la = ss(t, LES, LES + .4);
    fr.text('经验（只写一条）', 230, -180, { font: 'sansh', size: 36, color: C.ink, a: la });
    fr.text('什么时候', 60, -90, { font: 'sans', size: 30, color: C.ink2, align: 'l', a: la });
    fr.text('遇到冰坡', 60, -36, { font: 'sansh', size: 42, color: C.ink, align: 'l', a: ss(t, LES + .3, LES + .7) });
    fr.text('该怎么做', 60, 54, { font: 'sans', size: 30, color: C.ink2, align: 'l', a: ss(t, LES + .9, LES + 1.3) });
    fr.text('钉防滑钉，贴山壁走', 60, 108, { font: 'sansh', size: 42, color: C.ink, align: 'l', a: ss(t, LES + 1.2, LES + 1.6) });
  });
  const ar = ss(t, 120.4, 120.9) * (1 - ss(t, 121.7, 122.2));
  if (ar > 0) { CH.label(fr, '雪岭的，只进雪岭', 480, 96, { size: 34, a: ar }); fr.line(330, 118, 296, 150, { w: 4, color: C.ink, a: ar }); }
};

/* 10a · 下一单：新路书「雪岭 · 第二单」；马挂着原来的马具（没有钉、没有签）跑两趟，照样滑 */
CH.s10a = function (fr, t) {
  CH.station(fr, t);
  const r1 = seg(t, 126.3, 128.0), r2 = seg(t, 127.0, 128.8), ICE2 = .42;
  CH.horse(fr, 1330, 790, .95, { amp: 0, neck: .05 });
  const ca = ss(t, 126.2, 126.8);
  if (ca > 0) { fr.line(1140, 560, 1316, 610, { w: 3, color: C.ink, a: ca }); fr.circle(1316, 610, 6, { fill: C.ink, a: ca }); CH.label(fr, '原来的马具', 1010, 540, { size: 36, l2: '没有钉，没有签', a: ca }); }
  CH.strip(fr, t, { title: '路书 · 雪岭 · 第二单', goal: '镇', ice: ICE2, wave: 1.7, a: ss(t, 122.6, 123.2), rows: [
    { label: '第一趟', k: r1 * ICE2 + (r1 >= 1 ? .01 : 0), fail: 1, a: ss(t, 126.0, 126.3) },
    { label: '第二趟', k: r2 * ICE2 + (r2 >= 1 ? .01 : 0), fail: 1, a: ss(t, 126.7, 127.0) },
  ] });
};
/* 10b · 作坊：两位匠人动手前，先翻开雪岭日志，那条经验亮起 */
CH.s10b = function (fr, t) {
  CH.room(fr, t, 'shop');
  const op = E.out3(seg(t, 129.8, 130.6));
  fr.rect(560, 640, 800, 24, { r: 4, fill: C.wood }); fr.rect(600, 664, 24, 140, { fill: C.wood2 }); fr.rect(1296, 664, 24, 140, { fill: C.wood2 });
  CH.person(fr, 470, 800, 1.1, { role: 'copper', arm: .9, nod: .25 });
  CH.person(fr, 1450, 800, 1.1, { role: 'silver', dir: -1, arm: .9, nod: .25 });
  /* 书：先合着（封面「雪岭」），再翻开 */
  if (op < 1) CH.book(fr, 960, 560, 1.1 * (1 - op * .4), { title: '雪岭', a: 1 - op });
  if (op > 0) fr.g({ at: [960, 470], s: lerp(.4, 1, op), a: op, rot: -.012 }, () => {
    fr.rect(-372, -162, 760, 330, { r: 6, fill: '#000000', a: .2 }); fr.rect(-380, -170, 760, 330, { r: 6, fill: C.paper2 });
    fr.line(0, -160, 0, 150, { w: 3, color: '#B9AE9A' });
    fr.text('雪岭 · 第一单', -190, -110, { font: 'sansh', size: 34, color: C.ink });
    fr.text('防滑钉', -330, -30, { font: 'sans', size: 32, color: C.ink, align: 'l' }); CH.tick(fr, -60, -30, .9, 1);
    fr.text('路签', -330, 30, { font: 'sans', size: 32, color: C.ink, align: 'l' }); CH.tick(fr, -60, 30, .9, 1);
    fr.text('铃铛', -330, 90, { font: 'sans', size: 32, color: C.ink, align: 'l' }); CH.cross(fr, -60, 90, .8, 1);
    const hl = ss(t, 130.8, 131.3);
    fr.rect(24, -60, 340, 150, { r: 10, fill: C.gold, a: .45 * hl });
    fr.text('遇到冰坡', 40, -20, { font: 'sansh', size: 36, color: C.ink, align: 'l' });
    fr.text('钉防滑钉，贴山壁走', 40, 40, { font: 'sansh', size: 32, color: C.ink, align: 'l' });
  });
  fr.text('动手之前，先翻日志', 960, 190, { font: 'sansh', size: 44, color: C.ink, a: ss(t, 130.2, 130.7) });
};
})();
