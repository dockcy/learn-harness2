/* 《换马具》的道具：全片共用一套——马、人、马具架、路书（全片的尺子）、雪路和屋里的底。
 * 每样东西一个函数，场景只管摆位置、给动作。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const CH = (window.CH = window.CH || {});

/* 全片的关键时刻：每一镜的起点（字幕表在 film.js，和这里对着写） */
CH.T = { s2: 7.4, ttl: 14.4, s3: 20.6, s4: 32.2, s5: 51.2, s6: 69.4, s7: 75.8, s8: 86.4, s8b: 93.8, s9: 108.2, s10: 122.4, s10b: 129.4, s11: 133.2, s12: 159.8, s13: 167.6, end1: 174.4, end: 184 };

const C = CH.C = {
  coat: '#A8683F', coat2: '#8E5533', coat3: '#6F4127', mane: '#3B281C', hoof: '#2A1E18', muzzle: '#7E4A2E',
  blanket: '#3F6E78', blanket2: '#335A63', trim: '#E0B44C', saddle: '#5E3A26', saddle2: '#4A2D1D', bag: '#C9A66B', bag2: '#A88850',
  wood: '#7A5236', wood2: '#5C3C26', wood3: '#946640', wall: '#D8C9A8', wall2: '#C9B893', floor: '#9C7C58', floor2: '#8A6B4A',
  paper: '#EDE3CC', paper2: '#D4CABA', ink: '#3A2A22', ink2: '#6B5846',
  gold: '#EEC672', gold2: '#D9A93F', red: '#FC593F', redInk: '#C8432C', grey: '#9A948A',
  ice: '#CFE7F1', ice2: '#A9D0E0', snow: '#F2EEE6', snow2: '#E2DCD0', road: '#CDBFA6', road2: '#B8A88C',
  copper: '#C27A3E', copper2: '#9A5B2A', silver: '#8FA3B8', silver2: '#6F8399', slipPaper: '#F1DE9C', iron: '#4B4A52', iron2: '#6C6B74', felt: '#8C7F6E',
  teal: '#5EC2B8', skin: '#E7C29A', skin2: '#D4A97C',
};
CH.ICE = .64;
/* 描金：一圈金色虚线 + 很淡的金底（亮底上加法辉光看不见，所以用描边） */
const HL = CH.hl = (fr, x, y, rx, ry, k) => { if (!(k > 0)) return; fr.ellipse(x, y, rx, ry, { fill: '#EEC672', a: .22 * k }); fr.ellipse(x, y, rx, ry, { color: '#D9A93F', w: 5, a: .95 * k, dash: [12, 8] }); };                                              // 冰坡在路书上的位置（0 驿站 … 1 终点）

/* ---------- 马：侧面，朝右。x, y = 两腿中间的地面点；walk = 步态相位（弧度），slip 0…1 = 滑倒了多少
 * items：saddle（鞍和毯，默认有）bag（信袋）tag（木牌）pouch（锦囊）bell（铃铛）slip（路签）spikes（防滑钉）felt（毛毡裹蹄）
 * glow：{ 部件名: 0…1 } 给某件描一圈金光 ---------- */
CH.horse = function (fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a, sl = clamp(o.slip || 0), ph = o.walk || 0, it = Object.assign({ saddle: 1, bag: 1 }, o.items || {}), gl = o.glow || {};
  const amp = (o.amp == null ? .36 : o.amp) * (1 - sl), L1 = 80, L2 = 76;
  const legs = [[-74, Math.PI, 0, 1], [70, Math.PI * 1.5, 1, 1], [-88, 0, 0, 0], [60, Math.PI * .5, 1, 0]];   // [挂点 x, 相位, 前腿?, 远侧?]
  const th = legs.map(l => Math.sin(ph + l[1]) * amp + (l[2] ? .9 : -.8) * sl);
  const lift = legs.map(l => Math.max(0, Math.cos(ph + l[1])) * (amp > .05 ? 1 : 0) * (1 - sl));
  const cs = th.reduce((m, v) => m + Math.cos(v), 0) / 4, bob = amp > .05 ? Math.abs(Math.sin(ph * 2)) * 5 : 0;
  const by = -(L1 + L2) * cs - 30 - bob * .4 + sl * 18, rot = -sl * .05 + (o.tilt || 0);
  const leg = (i, col) => {
    const l = legs[i], hx = l[0], hy = by + 22, t1 = th[i], kx = hx + Math.sin(t1) * L1, ky = hy + Math.cos(t1) * L1;
    const t2 = t1 - (l[2] ? .95 : .55) * lift[i] + (l[2] ? -.25 : .35) * sl, fx = kx + Math.sin(t2) * L2, fy = ky + Math.cos(t2) * L2;
    fr.line(hx, hy - 10, kx, ky, { w: l[2] ? 26 : 30, color: col }); fr.line(kx, ky, fx, fy, { w: 15, color: col });
    fr.g({ at: [fx, fy], rot: t2 * .6 }, () => {
      fr.rect(-11, -14, 22, 16, { r: 3, fill: C.hoof });
      if (it.felt) fr.rect(-14, -22, 28, 20, { r: 6, fill: C.felt });
      if (it.spikes) for (let k = -1; k <= 1; k++) fr.path(`M ${k * 8 - 4},2 L ${k * 8 + 4},2 L ${k * 8},${9}`, { fill: '#D9DEE3' });
      HL(fr, 0, -6, 24, 22, gl.shoe);
    });
  };
  fr.g({ at: [x, y], s: [s * (o.dir || 1), s], a }, () => {
    fr.ellipse(0, 4, 150 + sl * 30, 13, { fill: '#000000', a: .18 });
    fr.g({ rot }, () => {
      leg(0, C.coat3); leg(1, C.coat3);
      const sw = Math.sin(ph * .5 + 1) * .1 + (o.tailSway || 0);
      fr.path(`M -112,${by - 26} Q ${-160 - sw * 60},${by + 6} ${-148 - sw * 90},${by + 92}`, { color: C.mane, w: 22, cap: 'round' });
      fr.path(`M -112,${by - 22} Q ${-150 - sw * 60},${by + 12} ${-132 - sw * 80},${by + 84}`, { color: '#2F2016', w: 9, cap: 'round' });
      leg(2, C.coat); leg(3, C.coat);
      /* 身子 */
      fr.ellipse(-78, by - 6, 56, 50, { fill: C.coat }); fr.ellipse(0, by, 112, 52, { fill: C.coat }); fr.ellipse(76, by + 2, 52, 48, { fill: C.coat });
      fr.ellipse(-10, by + 30, 84, 18, { fill: C.coat2, a: .55 });
      /* 脖子和头：低头吃力时整组往下转 */
      const nk = (o.neck || 0) + sl * .55 + (amp > .05 ? Math.sin(ph * 2) * .04 : 0);
      fr.g({ at: [70, by - 20], rot: nk }, () => {
        fr.path('M -14,-14 L 56,-104 L 100,-88 L 48,40 Z', { fill: C.coat });
        fr.path('M -8,-24 Q 26,-74 60,-108', { color: C.mane, w: 18, cap: 'round' });
        fr.g({ at: [84, -96], rot: .62 }, () => {
          fr.path('M -14,-20 L -4,-52 L 8,-20 Z', { fill: C.coat2 });
          fr.ellipse(26, 0, 58, 26, { fill: C.coat }); fr.ellipse(72, 6, 22, 20, { fill: C.muzzle });
          fr.circle(80, 2, 3.5, { fill: '#2A1A12' }); fr.circle(16, -9, 5.5, { fill: '#1E140E' }); fr.circle(17.5, -10.5, 1.6, { fill: '#FFF6E8' });
          fr.line(30, -18, 64, 14, { w: 5, color: C.saddle2 }); fr.line(4, 18, 60, 22, { w: 5, color: C.saddle2 });   // 笼头
          if (it.slip) fr.g({ at: [34, 22], rot: -.62 + Math.sin(ph) * .08 }, () => {
            fr.line(0, 0, 0, 14, { w: 2.5, color: C.ink });
            fr.rect(-14, 14, 28, 52, { r: 2, fill: C.slipPaper }); for (let k = 0; k < 3; k++) fr.line(-7, 26 + k * 12, 7, 26 + k * 12, { w: 2.5, color: C.ink, a: .7 });
            HL(fr, 0, 40, 26, 40, gl.slip);
          });
        });
        fr.path('M 50,-104 Q 68,-118 76,-98', { color: C.mane, w: 12, cap: 'round' });
        if (it.bell) fr.g({ at: [44, 20], rot: -nk + Math.sin(ph * 2) * .15 }, () => {
          fr.line(0, -14, 0, 4, { w: 3, color: C.ink }); fr.path('M -13,22 Q -12,2 0,2 Q 12,2 13,22 Z', { fill: C.gold2 }); fr.circle(0, 24, 4, { fill: C.ink });
          HL(fr, 0, 14, 24, 24, gl.bell);
        });
      });
      /* 鞍、毯、信袋和挂件 */
      if (it.saddle) {
        fr.path(`M -52,${by - 50} L 54,${by - 50} L 62,${by + 14} L -60,${by + 14} Z`, { fill: C.blanket });
        fr.rect(-60, by + 8, 122, 8, { fill: C.trim });
        fr.ellipse(0, by - 54, 50, 14, { fill: C.saddle }); fr.ellipse(40, by - 64, 12, 14, { fill: C.saddle }); fr.ellipse(-40, by - 62, 12, 10, { fill: C.saddle });
        fr.rect(-6, by - 48, 12, 96, { fill: C.saddle2 });
        HL(fr, 0, by - 22, 84, 62, gl.saddle);
      }
      if (it.bag) {
        fr.line(-96, by - 46, -72, by - 12, { w: 5, color: C.saddle2 });
        fr.rect(-118, by - 16, 58, 62, { r: 8, fill: C.bag }); fr.rect(-118, by - 16, 58, 18, { r: 8, fill: C.bag2 });
        fr.circle(-89, by + 2, 5, { fill: C.saddle2 });
        HL(fr, -89, by + 14, 44, 46, gl.bag);
      }
      if (it.tag) { const sc = it.tag; fr.g({ at: [60, by - 18], s: sc }, () => { fr.line(0, -22, 2, 0, { w: 3, color: C.ink }); fr.rect(-14, 0, 30, 40, { r: 3, fill: C.wood3 }); fr.line(-7, 12, 9, 12, { w: 3, color: C.ink }); fr.line(-7, 24, 9, 24, { w: 3, color: C.ink }); }); HL(fr, 61, by + 4, 28, 36, gl.tag); }
      if (it.pouch) { const sc = it.pouch; fr.g({ at: [-30, by + 20], s: sc }, () => { fr.line(0, -30, 0, -10, { w: 3, color: C.trim }); fr.path('M -18,-8 Q -24,26 0,30 Q 24,26 18,-8 Q 0,-16 -18,-8 Z', { fill: '#4A5F8C' }); fr.rect(-14, -12, 28, 6, { r: 3, fill: C.trim }); }); HL(fr, -30, by + 30, 30, 32, gl.pouch); }
    });
  });
};

/* ---------- 人：朝右（dir = -1 朝左）。y = 脚下。arm / armB = 前后手臂与竖直的夹角（正 = 往前）
 * role：zhou（老周：乌纱、灰须、蓝袍）copper（铜匠）silver（银匠）judge（挑的人：圆帽、眼镜） ---------- */
const ROLE = {
  zhou:   { robe: '#2F4660', robe2: '#24364A', hat: 'guan', beard: '#C9C3B8' },
  copper: { robe: '#5B4A3E', robe2: '#46392F', hat: 'cap', capC: '#8A5A34', apron: C.copper },
  silver: { robe: '#4E5662', robe2: '#3C434D', hat: 'cap', capC: '#6F8399', apron: C.silver },
  judge:  { robe: '#7B5A3A', robe2: '#5F452C', hat: 'round', glasses: 1 },
};
CH.person = function (fr, x, y, s, o = {}) {
  const R = Object.assign({}, ROLE[o.role || 'zhou'], o), a = o.a == null ? 1 : o.a, arm = o.arm || 0, armB = o.armB == null ? -.1 : o.armB, bob = o.bob || 0, nod = o.nod || 0;
  fr.g({ at: [x, y - bob], s: [s * (o.dir || 1), s], a }, () => {
    fr.ellipse(0, bob, 62, 10, { fill: '#000000', a: .18 });
    const sh = (ang, len) => [6 + Math.sin(ang) * len, -176 + Math.cos(ang) * len];
    const b = sh(armB, 84); fr.line(-2, -176, b[0] - 8, b[1], { w: 20, color: R.robe2 }); fr.circle(b[0] - 8, b[1], 10, { fill: C.skin2 });
    fr.path('M -34,-194 Q -48,-96 -58,0 L 58,0 Q 50,-96 36,-194 Z', { fill: R.robe });
    if (R.apron) fr.path('M -30,-138 L 32,-138 L 42,-12 L -40,-12 Z', { fill: R.apron });
    fr.rect(-44, -128, 90, 10, { fill: R.robe2 });
    fr.path('M -20,-196 L 4,-160 L 26,-196 Z', { fill: '#EFE6D6', a: .8 });
    fr.g({ at: [4, -224], rot: nod }, () => {
      fr.circle(0, 0, 33, { fill: C.skin }); fr.circle(-15, 2, 7, { fill: C.skin2 });
      fr.circle(18, -6, 3.6, { fill: '#2A1E18' }); fr.path('M 30,-2 L 37,6 L 29,8 Z', { fill: C.skin2 });
      if (R.glasses) { fr.circle(18, -6, 9, { color: '#2A1E18', w: 2.5 }); fr.line(9, -6, -6, -8, { w: 2, color: '#2A1E18' }); }
      if (R.beard) fr.path('M 8,12 Q 22,46 30,58 Q 34,30 30,12 Z', { fill: R.beard });
      if (R.hat === 'guan') { fr.rect(-30, -44, 62, 22, { r: 6, fill: '#1E1A1C' }); fr.rect(-22, -60, 46, 20, { r: 8, fill: '#1E1A1C' }); fr.line(-54, -32, 58, -32, { w: 6, color: '#1E1A1C' }); }
      if (R.hat === 'cap') { fr.path('M -34,-10 Q -30,-44 2,-44 Q 34,-44 36,-10 Z', { fill: R.capC }); fr.rect(-36, -14, 74, 8, { r: 4, fill: R.capC }); }
      if (R.hat === 'round') { fr.ellipse(2, -26, 40, 10, { fill: '#2A2224' }); fr.path('M -24,-28 Q -22,-56 2,-56 Q 26,-56 28,-28 Z', { fill: '#2A2224' }); }
    });
    const f = sh(arm, 86); fr.line(8, -176, f[0], f[1], { w: 22, color: R.robe2 === '#24364A' ? '#3A5574' : R.robe }); fr.circle(f[0], f[1], 11, { fill: C.skin });
    if (o.hold) o.hold(fr, f[0], f[1], arm);
  });
};
/* 手里的东西：锤子、毛笔 */
CH.hammer = (ang) => (fr, hx, hy) => fr.g({ at: [hx, hy], rot: ang }, () => { fr.line(0, 0, 0, -70, { w: 8, color: C.wood }); fr.rect(-20, -86, 40, 22, { r: 3, fill: C.iron }); });
CH.hammer2 = (fr, hx, hy, arm) => { const dx = Math.sin(arm), dy = Math.cos(arm), ex = hx + dx * 62, ey = hy + dy * 62; fr.line(hx, hy, ex, ey, { w: 8, color: C.wood }); fr.g({ at: [ex, ey], rot: -arm }, () => fr.rect(-22, -12, 44, 24, { r: 3, fill: C.iron })); };
CH.brush = (fr, hx, hy) => fr.g({ at: [hx, hy], rot: .5 }, () => { fr.line(0, 10, 0, -44, { w: 6, color: C.wood2 }); fr.path('M -4,10 L 4,10 L 0,24 Z', { fill: '#1E1A1C' }); });

/* ---------- 马具架：一副马具离开马的样子。y = 地面。items 同马；label 写在架子下面（不随翻转） ---------- */
CH.horseshoe = function (fr, x, y, s, o = {}) {
  fr.g({ at: [x, y], s }, () => {
    fr.path('M -14,10 L -14,-2 A 14 14 0 1 1 14,-2 L 14,10', { color: C.iron, w: 8, cap: 'round' });
    if (o.spikes) for (let k = -1; k <= 1; k++) fr.path(`M ${k * 11 - 4},14 L ${k * 11 + 4},14 L ${k * 11},22`, { fill: '#D9DEE3' });
    if (o.felt) fr.rect(-20, -20, 40, 36, { r: 10, fill: C.felt });
  });
};
CH.stand = function (fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a, it = o.items || {}, gl = o.glow || {};
  fr.g({ at: [x, y], s, a }, () => {
    fr.ellipse(0, 4, 140, 12, { fill: '#000000', a: .16 });
    fr.line(-96, 0, -64, -214, { w: 14, color: C.wood2 }); fr.line(96, 0, 64, -214, { w: 14, color: C.wood2 });
    fr.rect(-112, -228, 224, 22, { r: 4, fill: C.wood });
    fr.rect(-86, -118, 172, 10, { r: 4, fill: C.wood2 });
    if (it.saddle !== 0) {
      fr.path('M -70,-236 L 70,-236 L 78,-160 L -78,-160 Z', { fill: C.blanket }); fr.rect(-78, -166, 156, 8, { fill: C.trim });
      fr.ellipse(0, -240, 64, 16, { fill: C.saddle }); fr.ellipse(50, -250, 14, 16, { fill: C.saddle }); fr.ellipse(-50, -248, 14, 12, { fill: C.saddle });
    }
    for (let k = 0; k < 4; k++) { const hx = -60 + k * 40; fr.line(hx, -108, hx, -96, { w: 3, color: C.ink }); CH.horseshoe(fr, hx, -78, .9, { spikes: (it.spikes || 0) > k * .25 + .01, felt: (it.felt || 0) > k * .25 + .01 }); }
    HL(fr, 0, -78, 100, 40, gl.shoe);
    if (it.bell) fr.g({ at: [98, -206], s: it.bell }, () => { fr.line(0, 0, 0, 20, { w: 3, color: C.ink }); fr.path('M -14,44 Q -13,20 0,20 Q 13,20 14,44 Z', { fill: C.gold2 }); fr.circle(0, 46, 4, { fill: C.ink }); HL(fr, 0, 34, 26, 26, gl.bell); });
    if (it.slip) fr.g({ at: [-100, -206], s: it.slip }, () => { fr.line(0, 0, 0, 16, { w: 3, color: C.ink }); fr.rect(-16, 16, 32, 58, { r: 2, fill: C.slipPaper }); for (let k = 0; k < 3; k++) fr.line(-8, 30 + k * 13, 8, 30 + k * 13, { w: 3, color: C.ink, a: .7 }); HL(fr, 0, 44, 28, 42, gl.slip); });
    if (gl.all > 0) { fr.rect(-136, -272, 272, 292, { r: 18, fill: '#EEC672', a: .2 * gl.all }); fr.rect(-136, -272, 272, 292, { r: 18, color: '#D9A93F', w: 6, dash: [14, 10], a: gl.all }); }
  });
  if (o.label) fr.text(o.label, x, y + 44 * s, { font: 'sans', size: o.labelSize || 32, color: o.labelColor || C.ink, a: a * (o.labelA == null ? 1 : o.labelA) });
};

/* ---------- 路书：全片的尺子。一张纸条，上面一条路（驿 → 终点，冰坡在 ICE 处），下面每趟一行蹄印
 * rows：{ label, k 0…1 走到哪, fail（在 ICE 滑倒）, stumble（0…1 的位置，灰点）, wall（贴山壁绕过冰）, done（到终点打勾）, a, color } ---------- */
CH.strip = function (fr, t, o = {}) {
  const x0 = o.x == null ? 200 : o.x, y0 = o.y == null ? 34 : o.y, w = o.w || 1520, rows = o.rows || [], h = o.h || (92 + Math.max(2, rows.length) * 46), a = o.a == null ? 1 : o.a;
  const RX = f => x0 + 260 + f * (w - 370), ICE = o.ice == null ? CH.ICE : o.ice, WV = o.wave || 0;
  const geo = { RX, rowY: i => y0 + 112 + i * 46, x0, y0, w, h, ICE };
  if (a <= 0) return geo;
  fr.g({ a }, () => {
    fr.rect(x0 + 8, y0 + 10, w, h, { r: 6, fill: '#000000', a: .22 });
    fr.rect(x0, y0, w, h, { r: 4, fill: C.paper });
    fr.rect(x0 - 16, y0 - 8, 22, h + 16, { r: 9, fill: C.wood2 }); fr.rect(x0 + w - 6, y0 - 8, 22, h + 16, { r: 9, fill: C.wood2 });
    fr.text(o.title || '路书 · 雪岭', x0 + 30, y0 + 40, { font: 'sans', size: 28, color: C.ink, align: 'l' });
    /* 路：弯弯的一条，三道弯，冰坡在第三道弯 */
    const ry = f => y0 + 46 + Math.sin(f * Math.PI * 3 + WV) * 12, pts = []; for (let i = 0; i <= 60; i++) pts.push([RX(i / 60), ry(i / 60)]);
    fr.poly(pts, { color: C.road2, w: 7 });
    fr.ellipse(RX(ICE) + 20, ry(ICE) + 4, 46, 13, { fill: C.ice2 }); fr.text('冰坡', RX(ICE) + 20, y0 + 82, { font: 'sansm', size: 20, color: '#4F7F94' });
    fr.circle(RX(0) - 34, ry(0), 19, { fill: C.wood }); fr.text('驿', RX(0) - 34, ry(0) + 1, { font: 'sans', size: 22, color: C.paper });
    fr.circle(RX(1) + 34, ry(1), 19, { fill: C.ink2 }); fr.text(o.goal || '城', RX(1) + 34, ry(1) + 1, { font: 'sans', size: 22, color: C.paper });
    rows.forEach((r, i) => {
      const y = geo.rowY(i), ra = r.a == null ? 1 : r.a; if (ra <= 0) return;
      fr.g({ a: ra }, () => {
        fr.text(r.label, x0 + 30, y + 1, { font: 'sans', size: 24, color: r.color || C.ink, align: 'l' });
        fr.line(RX(0), y, RX(1), y, { w: 2, color: C.paper2 });
        const stop = r.fail ? ICE : 1, k = Math.min(clamp(r.k), stop), n = Math.floor(k * 46);
        for (let j = 0; j <= n; j++) {
          const f = j / 46, dy = r.wall ? -11 * (1 - ss(Math.abs(f - ICE), .03, .09)) : 0;
          fr.ellipse(RX(f), y + (j % 2 ? 6 : -6) + dy, 6, 4, { fill: r.trackColor || C.ink, a: .72 });
        }
        if (r.stumble != null && k >= r.stumble) { const sx = RX(r.stumble); fr.circle(sx, y, 13, { color: C.grey, w: 4 }); fr.circle(sx, y, 4, { fill: C.grey }); }
        if (r.fail && clamp(r.k) >= ICE) { const fx = RX(ICE) + 10, kk = ss(clamp(r.k), ICE, ICE + .02); fr.g({ at: [fx, y], s: lerp(1.6, 1, kk), a: kk }, () => { fr.line(-13, -13, 13, 13, { w: 6, color: C.red }); fr.line(13, -13, -13, 13, { w: 6, color: C.red }); }); }
        if (r.done && clamp(r.k) >= 1) { const cx = RX(1) - 4; fr.poly([[cx - 14, y], [cx - 3, y + 11], [cx + 16, y - 14]], { color: C.gold2, w: 7 }); }
      });
    });
  });
  return geo;
};
/* 一个金色虚线圈：圈住路书上的某处 */
CH.ring = (fr, x, y, rx, ry, a, col) => { if (a > 0) fr.ellipse(x, y, rx, ry, { color: col || C.gold2, w: 5, dash: [14, 10], a }); };
CH.tick = (fr, x, y, s, a, col) => { if (a > 0) fr.poly([[x - 16 * s, y], [x - 4 * s, y + 13 * s], [x + 18 * s, y - 16 * s]], { color: col || C.gold2, w: 7 * s, a }); };
CH.cross = (fr, x, y, s, a, col) => { if (a > 0) { fr.line(x - 14 * s, y - 14 * s, x + 14 * s, y + 14 * s, { w: 6 * s, color: col || C.red, a }); fr.line(x + 14 * s, y - 14 * s, x - 14 * s, y + 14 * s, { w: 6 * s, color: col || C.red, a }); } };
/* 引线标注：从 (x1,y1) 指向东西 (x0,y0)，字写在 x1,y1 */
CH.callout = (fr, x0, y0, x1, y1, str, a, o = {}) => {
  if (a <= 0) return; const k = E.out3(clamp(a * 1.4)), d = x1 >= x0 ? 1 : -1;
  fr.line(x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), { w: 3, color: o.lc || C.ink, a: .8 * a }); fr.circle(x0, y0, 6, { fill: o.lc || C.ink, a });
  if (o.plate) { const fs = o.size || 34, tw = Math.max(fr.measure(str, { font: o.font || 'sans', size: fs }), o.sub ? fr.measure(o.sub, { font: 'sans', size: 26 }) : 0) + 28,
    th = fs * 1.3 + (o.sub ? 26 * 1.35 : 0), px = d > 0 ? x1 + d * 14 - 14 : x1 + d * 14 - tw + 14, top = y1 - fs * .7, pa = ss(a, .3, 1) * .94;
    fr.rect(px, top, tw, th, { r: 8, fill: '#F7F0DF', a: pa }); fr.rect(px, top, tw, th, { r: 8, color: '#BFA678', w: 2, a: pa }); }
  fr.text(str, x1 + d * 14, y1 + 1, { font: o.font || 'sans', size: o.size || 34, color: o.color || C.ink, a: ss(a, .3, 1), align: d > 0 ? 'l' : 'r', shadow: o.shadow });
  if (o.sub) fr.text(o.sub, x1 + d * 14, y1 + (o.size || 34) * 1.15, { font: 'sans', size: 26, color: C.ink2, a: ss(a, .5, 1), align: d > 0 ? 'l' : 'r' });
};
/* 屋里的标签：一块米色小牌，字压在上面（墙上有柱子、窗框，光写字会糊） */
CH.label = (fr, l1, x, y, o = {}) => {
  const a = o.a == null ? 1 : o.a; if (a <= 0) return;
  const f1 = { font: o.font || 'sansh', size: o.size || 40 }, f2 = { font: 'sans', size: o.size2 || 28 };
  const w = Math.max(fr.measure(l1, f1), o.l2 ? fr.measure(o.l2, f2) : 0) + 44, h = f1.size * 1.45 + (o.l2 ? f2.size * 1.35 : 0);
  const top = y - f1.size * .72;
  fr.rect(x - w / 2 + 4, top + 5, w, h, { r: 10, fill: '#000000', a: .12 * a });
  fr.rect(x - w / 2, top, w, h, { r: 10, fill: '#F7F0DF', a: .96 * a }); fr.rect(x - w / 2, top, w, h, { r: 10, color: '#BFA678', w: 2, a });
  fr.text(l1, x, y + 1, { font: f1.font, size: f1.size, color: o.color || C.ink, a });
  if (o.l2) fr.text(o.l2, x, y + f1.size * .62 + f2.size * .72, { font: f2.font, size: f2.size, color: C.ink2, a });
};

/* ---------- 底：雪岭的山路。ice = 冰坡中心 x；cam = 横向机位（三层视差）；wall = 画出近处的山壁 ---------- */
CH.snowRoad = function (fr, t, o = {}) {
  const x = fr.x, cam = o.cam || 0, ice = o.ice == null ? 1260 : o.ice;
  let g = x.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, '#93A9BB'); g.addColorStop(.7, '#C9D2D6'); g.addColorStop(1, '#E9E2D3'); fr.rect(0, 0, W, 660, { fill: g });
  fr.glow(1460 - cam * .05, 190, 240, '#FFF3D6', .4); fr.circle(1460 - cam * .05, 190, 34, { fill: '#FFF8E6', a: .9 });
  fr.g({ at: [-cam * .1, 0] }, () => {                    // 远山
    const P = [[-200, 600], [80, 330], [300, 470], [520, 250], [760, 440], [980, 300], [1220, 470], [1440, 280], [1700, 430], [1940, 310], [2200, 600]];
    fr.poly(P.concat([[2200, 700], [-200, 700]]), { fill: '#B4C1CD', close: true });
    for (let i = 1; i < P.length - 1; i += 2) { const [px, py] = P[i]; fr.path(`M ${px - 70},${py + 56} L ${px},${py} L ${px + 78},${py + 62} L ${px + 40},${py + 52} L ${px + 14},${py + 70} L ${px - 22},${py + 50} Z`, { fill: '#F3F1EC' }); }
  });
  fr.g({ at: [-cam * .3, 0] }, () => {                    // 中景的坡和松树
    fr.path('M -300,640 Q 300,520 800,600 T 1900,560 T 2600,620 L 2600,760 L -300,760 Z', { fill: '#D9D6CF' });
    const r = rng(5); for (let i = 0; i < 26; i++) { const px = -200 + i * 105 + r() * 60, py = 600 + r() * 40, hh = 70 + r() * 60; fr.path(`M ${px},${py - hh} L ${px + hh * .32},${py} L ${px - hh * .32},${py} Z`, { fill: i % 3 ? '#56695E' : '#4A5C52' }); fr.path(`M ${px},${py - hh} L ${px + hh * .14},${py - hh * .55} L ${px - hh * .14},${py - hh * .55} Z`, { fill: '#F2EEE6', a: .9 }); }
  });
  fr.g({ at: [-cam, 0] }, () => {                         // 近景：路和冰
    if (o.wall) {                                         // 路里侧的山壁：贴着它走就碰不到外侧的冰
      const top = 'L -100,400 L 200,440 L 520,390 L 860,430 L 1180,380 L 1500,420 L 1800,385 L 2100,430 L 2600,410';
      fr.path(`M -400,700 L -400,430 ${top} L 2600,700 Z`, { fill: '#857D76' });
      for (let i = 0; i < 9; i++) { const y0 = 470 + i * 24; fr.path(`M -400,${y0} Q 600,${y0 - 18 + (i % 3) * 8} 1200,${y0 + 6} T 2600,${y0 - 4}`, { color: '#736B65', w: 4, a: .7 }); }
      const r = rng(21); for (let i = 0; i < 16; i++) { const cx = -300 + r() * 2800, cy = 460 + r() * 180; fr.path(`M ${cx},${cy} L ${cx + 14},${cy + 30} L ${cx + 4},${cy + 58}`, { color: '#5F5852', w: 4 }); }
      fr.path(`M -400,430 ${top} L 2600,446 L 2100,458 L 1800,414 L 1500,448 L 1180,408 L 860,458 L 520,418 L 200,468 L -100,428 L -400,458 Z`, { fill: C.snow });
    }
    g = x.createLinearGradient(0, 660, 0, 1080); g.addColorStop(0, C.snow); g.addColorStop(1, C.snow2); fr.rect(-400, 660, 3000, 420, { fill: g });
    fr.rect(-400, 692, 3000, 120, { fill: C.road }); fr.rect(-400, 692, 3000, 6, { fill: C.road2, a: .6 });
    for (let i = 0; i < 2; i++) fr.line(-400, 728 + i * 48, 2600, 728 + i * 48, { w: 3, color: C.road2, a: .45 });
    if (ice != null) {
      fr.ellipse(ice, 770, 190, 34, { fill: C.ice }); fr.ellipse(ice - 30, 764, 120, 16, { fill: '#E9F5FA' });
      for (let i = 0; i < 4; i++) { const gx = ice - 120 + i * 80, tw = .5 + .5 * Math.sin(t * 3 + i * 1.7); fr.line(gx, 770, gx + 34, 762, { w: 3, color: '#FFFFFF', a: .5 + .5 * tw }); }
    }
    if (o.pebble != null) { fr.ellipse(o.pebble, 778, 16, 9, { fill: '#7D7569' }); fr.ellipse(o.pebble - 4, 774, 7, 4, { fill: '#A39A8C' }); }
    const r = rng(9); for (let i = 0; i < 40; i++) fr.ellipse(-300 + r() * 2800, 840 + r() * 200, 30 + r() * 60, 5 + r() * 6, { fill: '#FFFFFF', a: .35 });
  });
  for (let i = 0; i < 70; i++) {                         // 飘雪：位置由 t 直接算
    const sp = 30 + hash(i * 3) * 50, px = ((hash(i) * 2400 + t * (12 + hash(i + 7) * 18)) % 2100) - 90, py = ((hash(i + 1) * 1200 + t * sp) % 1180) - 60;
    fr.circle(px, py, 2 + hash(i + 2) * 3.2, { fill: '#FFFFFF', a: .55 });
  }
};

/* ---------- 底：屋里。kind = stable（马厩）shop（作坊）hall（挑包裹的厅）study（书房） ---------- */
CH.room = function (fr, t, kind) {
  const x = fr.x;
  fr.rect(0, 0, W, H, { fill: C.wall });
  for (let i = 0; i < 7; i++) fr.rect(0, 40 + i * 104, W, 3, { fill: C.wall2, a: .7 });
  ({ stable: [300, 1880], shop: [120, 960, 1800], hall: [120, 1800], study: [760, 1880] }[kind] || [180, 1880]).forEach(bx => fr.rect(bx - 22, 0, 44, 860, { fill: C.wood }));
  fr.rect(0, 0, W, 34, { fill: C.wood2 });
  /* 窗：外面下雪 */
  const wx = kind === 'study' ? 1500 : 1050;
  fr.rect(wx, 150, 220, 200, { r: 4, fill: '#9FB3C3' }); fr.rect(wx, 300, 220, 50, { fill: '#E7E3DA' });
  for (let i = 0; i < 12; i++) { const px = wx + 10 + ((hash(i) * 200 + t * 6) % 200), py = 150 + ((hash(i + 3) * 190 + t * (28 + hash(i) * 20)) % 190); fr.circle(px, py, 2.6, { fill: '#FFFFFF', a: .8 }); }
  fr.rect(wx - 12, 140, 244, 14, { fill: C.wood2 }); fr.rect(wx - 12, 346, 244, 14, { fill: C.wood2 }); fr.rect(wx + 103, 150, 14, 200, { fill: C.wood2 }); fr.rect(wx, 243, 220, 12, { fill: C.wood2 });
  /* 灯 */
  const lx = kind === 'study' ? 1180 : 560;
  fr.line(lx, 34, lx, 110, { w: 3, color: C.ink }); fr.rect(lx - 22, 110, 44, 56, { r: 10, fill: '#E9A441' }); fr.glow(lx, 140, 300, '#FFD48A', .35);
  const fl = x.createLinearGradient(0, 700, 0, 1080); fl.addColorStop(0, C.floor); fl.addColorStop(1, C.floor2); fr.rect(0, 700, W, 380, { fill: fl });
  fr.rect(0, 696, W, 8, { fill: C.wood2 });
  for (let i = 0; i < 9; i++) fr.line(i * 240 - 60, 704, i * 260 - 300, 1080, { w: 3, color: C.wood2, a: .3 });
  if (kind === 'stable') {
    fr.rect(1400, 420, 520, 20, { r: 4, fill: C.wood2 }); fr.rect(1400, 520, 520, 20, { r: 4, fill: C.wood2 });
    for (let i = 0; i < 4; i++) fr.rect(1420 + i * 140, 400, 18, 300, { fill: C.wood2 });
    const r = rng(3); fr.ellipse(1640, 712, 260, 40, { fill: '#D8B65A' }); for (let i = 0; i < 60; i++) { const hx = 1400 + r() * 480, hy = 690 + r() * 40; fr.line(hx, hy, hx + (r() - .5) * 60, hy - r() * 30, { w: 3, color: '#B99A45' }); }
  }
  if (kind === 'shop') {
    fr.rect(240, 230, 420, 16, { fill: C.wood2 });
    [[290, 'h'], [370, 's'], [450, 't'], [530, 'h'], [610, 's']].forEach(([px, k]) => { fr.line(px, 246, px, 262, { w: 3, color: C.ink }); if (k === 'h') { fr.line(px, 262, px, 340, { w: 8, color: C.wood }); fr.rect(px - 18, 262, 36, 18, { fill: C.iron }); } else if (k === 's') CH.horseshoe(fr, px, 290, 1); else { fr.line(px - 10, 262, px + 10, 360, { w: 6, color: C.iron2 }); fr.line(px + 10, 262, px - 10, 360, { w: 6, color: C.iron2 }); } });
  }
  if (kind === 'hall') { fr.rect(1300, 120, 520, 60, { r: 6, fill: C.wood }); fr.text('收发处', 1560, 151, { font: 'sans', size: 34, color: C.paper }); }
  if (kind === 'study') {
    fr.rect(160, 120, 560, 560, { fill: C.wood2 }); for (let i = 0; i < 3; i++) fr.rect(160, 270 + i * 150, 560, 16, { fill: C.wood });
  }
};
/* ---------- 屋外：驿站门口 ---------- */
CH.station = function (fr, t) {
  const x = fr.x;
  let g = x.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#93A9BB'); g.addColorStop(1, '#E3DED3'); fr.rect(0, 0, W, 700, { fill: g });
  fr.poly([[-50, 560], [300, 300], [620, 480], [900, 260], [1250, 470], [1600, 290], [1980, 520], [1980, 700], [-50, 700]], { fill: '#B4C1CD', close: true });
  /* 房子 */
  fr.rect(260, 300, 900, 420, { fill: C.wood }); fr.path('M 200,320 L 710,150 L 1220,320 Z', { fill: '#4A3A34' }); fr.path('M 200,320 L 710,150 L 1220,320 L 1170,330 L 710,180 L 250,330 Z', { fill: C.snow });
  fr.rect(260, 330, 900, 14, { fill: C.wood2 });
  fr.rect(600, 420, 220, 300, { fill: '#3A2A22' }); fr.rect(610, 430, 96, 290, { fill: C.wood2 }); fr.rect(714, 430, 96, 290, { fill: C.wood2 });
  fr.rect(650, 352, 120, 52, { r: 4, fill: '#2A1E18' }); fr.text('雪岭驿', 710, 379, { font: 'sans', size: 30, color: C.gold });
  fr.line(900, 330, 900, 380, { w: 3, color: C.ink }); fr.rect(878, 380, 44, 60, { r: 10, fill: '#E9A441' }); fr.glow(900, 410, 160, '#FFD48A', .3);
  /* 墙上的马具架 */
  fr.rect(320, 420, 220, 200, { fill: '#5C4030' });
  fr.g({ at: [430, 610], s: .78 }, () => CH.stand(fr, 0, 0, 1, { items: {} }));
  g = x.createLinearGradient(0, 700, 0, 1080); g.addColorStop(0, C.snow); g.addColorStop(1, C.snow2); fr.rect(0, 700, W, 380, { fill: g });
  fr.rect(0, 718, W, 90, { fill: C.road, a: .7 });
  for (let i = 0; i < 50; i++) { const sp = 30 + hash(i * 3) * 50, px = ((hash(i) * 2400 + t * 14) % 2100) - 90, py = ((hash(i + 1) * 1200 + t * sp) % 1180) - 60; fr.circle(px, py, 2 + hash(i + 2) * 3, { fill: '#FFFFFF', a: .55 }); }
};

/* 一本日志（侧面看是一本书；open 时摊开） */
CH.book = function (fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a;
  fr.g({ at: [x, y], s, a, rot: o.rot || 0 }, () => {
    fr.rect(-58, -80, 116, 160, { r: 6, fill: o.color || '#6E3B2E' }); fr.rect(-58, -80, 16, 160, { r: 4, fill: '#000000', a: .2 });
    fr.rect(-30, -50, 70, 100, { r: 3, fill: C.paper, a: .92 });
  });
  if (o.title) fr.text(o.title, x + 5 * s, y, { font: 'sans', size: 30 * s, color: C.ink, a });
};
/* 包裹 */
CH.parcel = function (fr, x, y, s, o = {}) {
  const a = o.a == null ? 1 : o.a;
  fr.g({ at: [x, y], s, a }, () => {
    fr.ellipse(0, 6, 96, 10, { fill: '#000000', a: .16 });
    fr.rect(-90, -110, 180, 116, { r: 6, fill: '#C9A26A' }); fr.rect(-90, -110, 180, 22, { r: 6, fill: '#B48D58' });
    fr.line(0, -110, 0, 6, { w: 8, color: '#7A5236' }); fr.line(-90, -52, 90, -52, { w: 8, color: '#7A5236' });
    if (o.wet) fr.ellipse(52, -26, 34 * o.wet, 24 * o.wet, { fill: '#5F7F8E', a: .55 });
    if (o.seal) { fr.circle(-46, -82, 20 * (1 + (1 - o.seal) * .6), { fill: C.gold2, a: o.seal }); fr.circle(-46, -82, 11, { fill: '#B07E26', a: o.seal }); }
  });
  if (o.label) { fr.rect(x - 36 * s, y - 30 * s - 120 * s, 72 * s, 64 * s, { r: 6, fill: C.paper, a }); fr.text(o.label, x, y - 150 * s + 34 * s - 2, { font: 'sansh', size: 44 * s, color: C.ink, a }); }
};
})();
