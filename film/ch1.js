/* 第一段：钩子（雪路上滑倒）→ 驿站门口（马不许换）→ 片名 → 马厩里认马具 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const K = VKit, CH = (window.CH = window.CH || {}), C = CH.C, T = CH.T;

/* 左上角的场景说明：地点 + 第几单 */
CH.caption = (fr, big, small, a) => { if (a <= 0) return; fr.text(big, 110, 92, { font: 'sansh', size: 40, color: C.ink, align: 'l', a }); const w = fr.measure(big, { font: 'sansh', size: 40 }); fr.rect(110, 120, w, 5, { fill: C.gold2, a }); fr.text(small, 130 + w, 94, { font: 'sans', size: 30, color: C.ink2, align: 'l', a }); };

/* 撒出去的信：从信袋飞出，落在雪里。位置只由 t 决定 */
CH.letters = (fr, t, t0, x0, y0, n = 3) => {
  for (let i = 0; i < n; i++) {
    const k = seg(t, t0 + i * .06, t0 + i * .06 + .7); if (k <= 0) continue;
    const dx = [-150, 40, 190][i % 3] + hash(i + 5) * 30, x = x0 + dx * E.out3(k), y = lerp(y0, 800 + i * 9, E.in2(k)) - Math.sin(k * Math.PI) * 120, rot = (hash(i) - .5) * 2.6 * k;
    fr.g({ at: [x, y], rot }, () => { fr.rect(-30, -20, 60, 40, { r: 2, fill: '#F4EEDF' }); fr.path('M -30,-20 L 0,4 L 30,-20', { color: '#B9AE96', w: 3 }); });
  }
};
/* 蹄下溅起的雪/冰屑 */
CH.spray = (fr, t, t0, x, y, n = 18, col = '#FFFFFF') => {
  for (let i = 0; i < n; i++) { const k = seg(t, t0, t0 + .7 + hash(i) * .3); if (k <= 0 || k >= 1) continue; const ang = -Math.PI * (.15 + hash(i + 9) * .7), v = 120 + hash(i + 3) * 200; fr.circle(x + Math.cos(ang) * v * k, y + Math.sin(ang) * v * k + 260 * k * k, 4 + hash(i + 1) * 5, { fill: col, a: (1 - k) * .9 }); }
};

/* 1 · 雪路：驿马驮着信从左走来，走到冰坡前腿一滑，跪倒，信撒了一地 */
CH.s1 = function (fr, t) {
  const z = lerp(1, 1.07, ss(t, 0, T.s2));
  fr.g({ at: [1100, 680], s: z }, () => fr.g({ at: [-1100, -680] }, () => {
    CH.snowRoad(fr, t, { ice: 1260 });
    const TS = 4.3, x = 120 + Math.min(t, TS) * 240 + 70 * E.out3(seg(t, TS, 5.0)), sl = E.out3(seg(t, TS, TS + .45));
    CH.horse(fr, x, 772, .95, { walk: Math.min(t, TS) * 7.6, slip: sl });
    CH.spray(fr, t, TS, x + 90, 770, 22);
    CH.letters(fr, t, TS + .15, x - 85, 600);
  }));
  CH.caption(fr, '雪岭', '第一单', ss(t, .4, 1.0));
};

/* 2 · 驿站门口：老周想换马（气泡里一匹新马）→ 告示「官马 · 不得更换」盖红印 → 他转身看墙上的马具架，马具亮起 */
CH.s2 = function (fr, t) {
  CH.station(fr, t);
  const turn = t > 11.3, look = ss(t, 11.4, 12.2);
  /* 墙上马具架的金光：那就换马具 */
  fr.glow(430, 520, 260, C.gold, .55 * look * (.8 + .2 * Math.sin(t * 4)));
  CH.horse(fr, 1330, 790, .95, { amp: 0, neck: .32, items: { bag: 0 } });
  CH.person(fr, 1010, 800, 1.05, { role: 'zhou', dir: turn ? -1 : 1, arm: turn ? lerp(.2, 1.5, ss(t, 11.5, 12.1)) : lerp(.1, .5, ss(t, 8.0, 8.6)) * (1 - ss(t, 10.6, 11.0)), nod: turn ? -.05 : .12 });
  /* 想换一匹：头顶的气泡里一匹浅色的马，然后被打叉 */
  const bub = ss(t, 8.6, 9.0) * (1 - ss(t, 11.0, 11.4));
  if (bub > 0) fr.g({ a: bub }, () => {
    fr.circle(1060, 520, 12, { fill: '#FFFFFF', a: .9 }); fr.circle(1090, 470, 18, { fill: '#FFFFFF', a: .9 });
    fr.ellipse(1150, 350, 170, 110, { fill: '#FFFFFF', a: .92 });
    fr.g({ at: [1150, 420], s: .42 }, () => { const sv = Object.assign({}, C); CH.C.coat = '#D9CBB4'; CH.C.coat2 = '#C4B49A'; CH.C.coat3 = '#B3A288'; CH.C.muzzle = '#B9A68A'; CH.horse(fr, 0, 0, 1, { amp: 0, items: { saddle: 0, bag: 0 } }); Object.assign(CH.C, sv); });
    CH.cross(fr, 1150, 350, 3.2, ss(t, 10.2, 10.4), C.red);
  });
  /* 告示牌 */
  const dn = E.outBack(ss(t, 9.7, 10.2));
  fr.g({ at: [1690, lerp(-200, 440, dn)] }, () => {
    fr.line(-90, -260, -60, -150, { w: 4, color: C.ink }); fr.line(90, -260, 60, -150, { w: 4, color: C.ink });
    fr.rect(-130, -150, 260, 250, { r: 6, fill: C.paper, }); fr.rect(-130, -150, 260, 250, { r: 6, color: C.wood2, w: 6 });
    fr.text('官马', 0, -82, { font: 'sansh', size: 64, color: C.ink, track: 8 });
    fr.text('不得更换', 0, 0, { font: 'sans', size: 44, color: C.ink, track: 6 });
    const st = ss(t, 10.25, 10.4); fr.g({ at: [70, 56], s: lerp(1.8, 1, st), a: st, rot: -.2 }, () => { fr.circle(0, 0, 34, { fill: C.redInk }); fr.text('驿', 0, 1, { font: 'sansh', size: 36, color: '#FBE9DF' }); });
  });
  if (look > 0) fr.text('马具', 430, 400, { font: 'sansh', size: 46, color: C.ink, a: look, track: 6 });
};

/* 片名：压暗，金字《换马具》，下面一枚马蹄铁细线 */
CH.title = function (fr, t) {
  const lt = t - (T.ttl + .55), a = 1 - ss(t, T.s3 - .6, T.s3);
  fr.rect(0, 0, W, H, { fill: '#17121E' });
  if (lt < 0) return;
  K.titleGilt(fr, lt, { la: '', zh: '换马具', tag: '模型不动，怎么越做越好', a, cy: 440, size: 200, motif(fr, lt, aa) {
    const k = E.io3(seg(lt, .7, 1.9)), pts = []; for (let i = 0; i <= 48; i++) { const u = Math.PI * 1.25 - i / 48 * Math.PI * 1.5; pts.push([960 + Math.cos(u) * 58, 628 - Math.sin(u) * 58]); }
    fr.poly(pts, { color: '#D9B46A', w: 5, k, a: aa * .9 });
    for (let i = 0; i < 6; i++) { const u = Math.PI * 1.1 - i / 5 * Math.PI * 1.2; fr.circle(960 + Math.cos(u) * 58, 628 - Math.sin(u) * 58, 4, { fill: '#17121E', a: aa * ss(lt, 1.6, 2.0) }); }
  } });
};

/* 3 · 马厩：认一认马具。鞍、毯、信袋描金；老周说一句（气泡）；木牌、锦囊挂上；蹄铁一闪。每样一根引线 */
CH.s3 = function (fr, t) {
  CH.room(fr, t, 'stable');
  const HX = 760, HY = 792, S = 1.3, by = -186;                     // 站着时身体中心在 by（马的局部坐标）
  const P = (lx, ly) => [HX + lx * S, HY + ly * S];
  const pulse = .75 + .25 * Math.sin(t * 5), all = ss(t, 28.7, 29.2) * (1 - ss(t, 31.4, 31.9));
  const g0 = (ss(t, 21.0, 21.6) * (1 - ss(t, 24.2, 24.8)) + all) * pulse;
  const tag = E.outBack(ss(t, 25.6, 26.0)), pouch = E.outBack(ss(t, 26.5, 26.9)), shoe = ss(t, 27.4, 27.7) * (1 - ss(t, 28.3, 28.7)) + all;
  CH.horse(fr, HX, HY, S, { amp: 0, neck: .1 + .03 * Math.sin(t * 1.3), items: { tag, pouch }, glow: { saddle: g0, bag: g0, tag: all * pulse, pouch: all * pulse, shoe: shoe * pulse } });
  const talk = t > 24.7 && t < 26.4;
  CH.person(fr, 1360, 800, 1.15, { role: 'zhou', dir: -1, arm: talk ? .7 + Math.sin(t * 7) * .15 : .15, nod: talk ? Math.sin(t * 9) * .04 : 0 });
  /* 出发前念的话：气泡 */
  const bb = ss(t, 24.7, 25.1) * (1 - ss(t, 31.4, 31.9));
  if (bb > 0) fr.g({ a: bb }, () => {
    fr.path('M 1250,420 L 1300,470 L 1310,416 Z', { fill: '#FFFFFF' });
    fr.rect(1080, 300, 420, 124, { r: 30, fill: '#FFFFFF' });
    fr.text('“稳着走，信别湿。”', 1290, 362, { font: 'sans', size: 36, color: C.ink });
    CH.label(fr, '出发前念的话', 1290, 248, { font: 'sans', size: 34, a: ss(t, 25.0, 25.4) });
  });
  const fade = 1 - ss(t, 31.4, 31.9);
  const tp = P(61, by + 10), pp = P(-30, by + 32), hp = P(-86, -10);
  CH.callout(fr, tp[0], tp[1], 1060, 640, '木牌', ss(t, 25.7, 26.3) * fade, { sub: '告诉它工具怎么用' });
  CH.callout(fr, pp[0], pp[1], 440, 600, '锦囊', ss(t, 26.6, 27.2) * fade, { sub: '遇事拆开看的招' });
  CH.callout(fr, hp[0], hp[1], 440, 760, '蹄铁', ss(t, 27.5, 28.1) * fade, { sub: '钉死了的做法' });
};
})();
