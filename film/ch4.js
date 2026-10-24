/* 第四段：揭晓（暗场上把全片的东西排成一排，逐个贴上真名，两层圈）→ 数字卡 → 回到冰坡 → 片尾 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E, hash, rng } = VK;
const K = VKit, CH = (window.CH = window.CH || {}), C = CH.C, T = CH.T, P = K.PAL.flat;

const DARK = '#1B1620';
/* 揭晓时刻：和字幕 36–42 对齐 */
const RV = { model: 133.6, weights: 137.1, harness: 140.8, record: 144.5, lv1: 148.2, lv2: 151.9, name: 155.7 };
CH.RV = RV;
/* 圆角框 + 一个转圈的箭头：表示"一层循环" */
const loopBox = (fr, x, y, w, h, col, k, a, label, lx) => {
  if (a <= 0) return;
  const pts = [], r = 40, segs = [[x + r, y, x + w - r, y], [x + w, y + r, x + w, y + h - r], [x + w - r, y + h, x + r, y + h], [x, y + h - r, x, y + r]];
  const per = 2 * (w + h); const L = per * k;
  fr.g({ a }, () => {
    const x0 = fr.x; x0.save(); x0.beginPath(); x0.roundRect(x, y, w, h, r); x0.setLineDash([per]); x0.lineDashOffset = per - L; x0.lineWidth = 5; x0.strokeStyle = col; x0.stroke(); x0.restore();
    if (k >= 1) { fr.path(`M ${x + w * .5 - 18},${y - 16} L ${x + w * .5 + 14},${y} L ${x + w * .5 - 18},${y + 16} Z`, { fill: col }); fr.path(`M ${x + w * .5 + 18},${y + h - 16} L ${x + w * .5 - 14},${y + h} L ${x + w * .5 + 18},${y + h + 16} Z`, { fill: col }); }
    fr.rect(lx - 10, y - 26, fr.measure(label, { font: 'sansh', size: 36 }) + 20, 52, { fill: DARK });
    fr.text(label, lx, y + 1, { font: 'sansh', size: 36, color: col, align: 'l', a: ss(k, .2, .6) });
  });
};
const lock = (fr, x, y, a) => { if (a <= 0) return; fr.g({ a }, () => { fr.path(`M ${x - 12},${y - 4} L ${x - 12},${y - 16} A 12 12 0 0 1 ${x + 12},${y - 16} L ${x + 12},${y - 4}`, { color: P.ink, w: 5 }); fr.rect(x - 18, y - 6, 36, 28, { r: 4, fill: P.ink }); }); };

/* 11 · 揭晓：马 = 大模型（权重不改）；马具 = harness；路书 = 执行记录；两匠 = 通用 / 领域改动；
 * 帘子和包裹 = 盲选；日志 = 经验库。金框 = 第一层（任务里），青框 = 第二层（跨任务）。最后大字 Harness² */
CH.s11 = function (fr, t) {
  fr.rect(0, 0, W, H, { fill: DARK });
  const GY = 680, dimAll = 1 - .72 * ss(t, RV.name, RV.name + .6);
  const on = (t0, d = .5) => ss(t, t0, t0 + d);
  const hiA = (t0, t1) => .35 + .65 * on(t0) * (1 - ss(t, t1, t1 + .5));     // 正在讲的那一样亮，其余压暗
  const lv1 = on(RV.lv1) * (1 - ss(t, RV.lv2, RV.lv2 + .4));
  fr.g({ a: dimAll }, () => {
    /* 路书 = 执行记录 */
    fr.g({ a: Math.max(hiA(RV.record, RV.lv1), .35 + .65 * lv1) }, () => CH.strip(fr, t, { x: 300, y: 18, w: 1240, rows: [{ label: '第一趟', k: 1, fail: 1, stumble: CH.S4.stumble }, { label: '第二趟', k: 1, fail: 1 }] }));
    fr.text('执行记录', 1730, 96, { font: 'sansh', size: 44, color: P.gold, a: on(RV.record) });
    fr.text('（执行轨迹）', 1730, 148, { font: 'sans', size: 28, color: P.dim, a: on(RV.record) });
    /* 马 = 大模型；马具 = harness */
    const hm = Math.max(hiA(RV.model, RV.record), .35 + .65 * lv1);
    const hg = on(RV.harness) * (1 - ss(t, RV.record, RV.record + .5));
    fr.g({ a: hm }, () => CH.horse(fr, 320, GY, 1.0, { amp: 0, items: { spikes: 1, slip: 1, tag: 1, pouch: 1 }, glow: { saddle: hg, bag: hg, tag: hg, pouch: hg, slip: hg, shoe: hg } }));
    fr.text('大模型', 320, 740, { font: 'sansh', size: 48, color: P.gold, a: on(RV.model) });
    lock(fr, 252, 792, on(RV.weights)); fr.text('权重不改', 340, 800, { font: 'sans', size: 32, color: P.ink, a: on(RV.weights) });
    const ha = on(RV.harness) * (1 - ss(t, RV.lv1 - .3, RV.lv1));
    if (ha > 0) {
      fr.line(470, 330, 360, 420, { w: 3, color: P.gold, a: ha });
      fr.text('harness', 480, 262, { font: 'latinm', size: 64, color: P.gold, a: ha, align: 'l' });
      fr.text('＝ 马具 ＝ 模型之外的一切', 484, 316, { font: 'sans', size: 30, color: P.ink, a: ha * on(RV.harness + .3, .8), align: 'l' });
      fr.text('提示词 · 工具说明 · 技能 · 脚本 …', 484, 358, { font: 'sans', size: 26, color: P.dim, a: ha * on(RV.harness + .8, .8), align: 'l' });
    }
    /* 两位匠人 = 两种编辑 */
    const hc = Math.max(hiA(RV.record, RV.lv1), .35 + .65 * lv1);
    fr.g({ a: hc }, () => { CH.person(fr, 740, GY, .95, { role: 'copper', arm: .5 }); CH.person(fr, 960, GY, .95, { role: 'silver', dir: -1, arm: .5 }); });
    fr.text('通用改动', 740, 740, { font: 'sansh', size: 36, color: '#E6A066', a: on(RV.record + .4) });
    fr.text('领域改动', 960, 740, { font: 'sansh', size: 36, color: '#B3C6DA', a: on(RV.record + .6) });
    fr.text('两位“编辑”', 850, 794, { font: 'sans', size: 28, color: P.dim, a: on(RV.record + .8) });
    /* 帘子和包裹 = 盲选 */
    fr.g({ a: .35 + .65 * lv1 }, () => {
      for (let i = 0; i < 3; i++) fr.rect(1140 + i * 28, 430, 30, 250, { fill: i % 2 ? '#3E5A4C' : '#476655' });
      CH.parcel(fr, 1320, GY, .6, { label: '甲', wet: 1 }); CH.parcel(fr, 1460, GY, .6, { label: '乙', seal: 1 });
    });
    fr.text('盲选', 1330, 740, { font: 'sansh', size: 36, color: P.ink, a: on(RV.lv1 + .5) });
    fr.text('只看交付物', 1330, 794, { font: 'sans', size: 28, color: P.dim, a: on(RV.lv1 + .7) });
    /* 日志 = 经验库 */
    fr.g({ a: .35 + .65 * on(RV.lv2) }, () => { CH.book(fr, 1660, 580, 1.2, { title: '雪岭' }); CH.book(fr, 1795, 600, .9, { title: '沙原', color: '#B0803A' }); });
    fr.text('经验库', 1715, 740, { font: 'sansh', size: 36, color: P.ink, a: on(RV.lv2 + .4) });
    fr.text('按领域分本', 1715, 794, { font: 'sans', size: 28, color: P.dim, a: on(RV.lv2 + .6) });
    /* 两层框：金 = 第一层（一个任务里），青 = 第二层（跨任务） */
    loopBox(fr, 130, 252, 1440, 568, P.gold, E.io3(seg(t, RV.lv1, RV.lv1 + 1.2)), on(RV.lv1, .2), '第一层：一个任务里改马具', 170);
    loopBox(fr, 100, 230, 1750, 604, CH.C.teal, E.io3(seg(t, RV.lv2, RV.lv2 + 1.4)), on(RV.lv2, .2), '第二层：跨任务，越改越会改', 1240);
  });
  /* Harness² */
  const na = on(RV.name, .6);
  if (na > 0) {
    const w = fr.measure('Harness', { font: 'latinm', size: 170 });
    fr.text('Harness', 960 - 30, 450, { font: 'latinm', size: 170, color: P.gold, a: na, glow: 30, glowColor: '#B8873C', glowA: .5 });
    fr.text('2', 960 - 30 + w / 2 + 22, 395, { font: 'latinm', size: 88, color: P.gold, a: na, glow: 24, glowColor: '#B8873C', glowA: .5 });
    fr.text('两层递归 · 只改 harness，不动模型', 960, 586, { font: 'sans', size: 40, color: P.ink, a: on(RV.name + .5, .6), track: 4 });
  }
  K.flash(fr, t, RV.name, { rise: .15, fall: .6, peak: .35 });
};

/* 12 · 数字卡（出处：项目 README） */
CH.s12 = function (fr, t) {
  fr.rect(0, 0, W, H, { fill: DARK });
  const lt = t - T.s12;
  fr.text('只走一步 Harness²，对比各自原来的 harness', 960, 150, { font: 'sans', size: 36, color: P.dim, a: ss(lt, .2, .7), track: 3 });
  fr.text('最多提升', 960, 236, { font: 'sansh', size: 44, color: P.ink, a: ss(lt, .4, .9), track: 8 });
  const cols = [['+11.5', 'WorkBuddy-Bench', '分'], ['+4.5', 'JobBench', '分'], ['+11.8', 'LAB', '部分通过率 · 百分点']];
  cols.forEach(([n, b, u], i) => {
    const x = 400 + i * 560, a = ss(lt, .7 + i * .35, 1.1 + i * .35);
    fr.text(n, x, 400, { font: 'latinm', size: 150, color: P.gold, a, glow: 20, glowColor: '#B8873C', glowA: .4 });
    fr.text(b, x, 512, { font: 'latin', size: 44, color: P.ink, a });
    fr.text(u, x, 562, { font: 'sans', size: 30, color: P.dim, a });
  });
  fr.text('模型：GLM-5、Gemini 3.5 Flash', 960, 660, { font: 'sans', size: 34, color: P.ink, a: ss(lt, 1.8, 2.3) });
  const b = ss(t, 163.9, 164.4);
  if (b > 0) { fr.text('给每个任务的预算再多一些 → 还有提升', 960, 730, { font: 'sansh', size: 38, color: P.gold, a: b }); }
  fr.text('出处：google-research/harness2 项目 README · 论文 arXiv:2610.14224', 960, 800, { font: 'sans', size: 24, color: P.mute, a: ss(lt, 1.0, 1.5) });
};

/* 13 · 回到开场：同一段雪路、同一个冰坡。马带着防滑钉和路签，稳稳走过去 */
CH.s13 = function (fr, t) {
  const lt = t - T.s13, z = lerp(1.07, 1, ss(lt, 0, 6.8));
  fr.g({ at: [1100, 680], s: z }, () => fr.g({ at: [-1100, -680] }, () => {
    CH.snowRoad(fr, t, { ice: 1260 });
    const x = 360 + lt * 190;
    CH.horse(fr, x, 772, .95, { walk: lt * 6.4, amp: .3, items: { spikes: 1, slip: 1 } });
    if (x > 1080 && x < 1450) CH.spray(fr, t, Math.floor(t * 3) / 3, x + 90, 770, 6, '#E9F5FA');
  }));
  CH.caption(fr, '雪岭', '又一单', ss(lt, .4, 1.0));
};

/* 片尾：片名 + 文献 */
CH.endCard = function (fr, t) {
  fr.rect(0, 0, W, H, { fill: '#17121E' });
  const lt = t - (T.end1 + .3), a = 1 - ss(t, T.end - 1.0, T.end - .1);
  if (lt < 0) return;
  K.titleGilt(fr, lt, { la: '', zh: '换马具', tag: '模型不动，怎么越做越好', a, cy: 360, size: 150, tagDy: 150, rays: .3 });
  const ra = ss(lt, 1.6, 2.3) * a;
  fr.text('方法：Harness²  ·  google-research/harness2  ·  arXiv:2610.14224', 960, 650, { font: 'sans', size: 30, color: P.dim, a: ra });
  fr.text('互动教程：dockcy.github.io/learn-harness2', 960, 706, { font: 'sans', size: 30, color: P.dim, a: ra });
  fr.text('寓言是示意，数字出自项目 README', 960, 762, { font: 'sans', size: 26, color: P.mute, a: ra });
};
})();
