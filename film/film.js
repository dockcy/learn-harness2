/* ★ 片名 · 《换马具》· B 寓言 · 约 184 秒
 * 这条片只讲一件事：马（大模型）不许换，Harness² 只改它外面那层 harness（马具）——
 *   一个任务里：先照老样子跑 k 趟 → 两位匠人（通用 / 领域改动）各改一副 → 各试跑一趟 → 只留有证据的改动拼成一副
 *   → 拼 k 回 → 隔帘只看交付物挑一副（必须写理由）；跨任务：日志按领域分本，下一单的匠人先翻日志。
 * 事实与出处见同目录 storyboard.md 的事实表（google-research/harness2 的 README、源码与本仓库教程）。
 * 示意：雪岭、冰坡、防滑钉、路签、铃铛、毛毡、包裹和甲乙的对应都是编的；demo 里真实的例子是账本求和（漏算负数）。
 * 分章：props.js（道具）· ch1（钩子、片名、认马具）· ch2（跑两趟、两匠、试跑、拼合）· ch3（盲选、日志、下一单）· ch4（揭晓、数字、回场、片尾）。 */
(function () {
'use strict';
const { W, H, clamp, lerp, seg, ss, E } = VK;
const K = VKit, CH = window.CH, T = CH.T;

const SUBS = [                                             // {词} 金色，{!词} 红色；tone: 'gold' 整句金色（规则句）
  { a: .5,    b: 3.9,   zh: '驿马驮着信，头一回走雪岭' },
  { a: 4.2,   b: 7.1,   zh: '走到冰坡，{!滑}了一跤' },
  { a: 7.8,   b: 10.9,  zh: '驿丞老周想换匹马。不行' },
  { a: 11.1,  b: 14.0,  zh: '官马不许换。那就换{马具}' },
  { a: 21.0,  b: 24.4,  zh: '马具：除了马，别的都算' },
  { a: 24.7,  b: 28.4,  zh: '出发前念的话、木牌、锦囊、蹄铁' },
  { a: 28.7,  b: 31.8,  zh: '马不能动，这些都能改', tone: 'gold' },
  { a: 32.6,  b: 36.2,  zh: '老周不急着改，先照老样子跑两趟' },
  { a: 36.5,  b: 39.8,  zh: '每一趟，都在路书上留下蹄印' },
  { a: 40.1,  b: 43.4,  zh: '两趟，都在同一个冰坡{!滑倒}' },
  { a: 43.7,  b: 47.2,  zh: '回回都错的地方，才是真毛病', tone: 'gold' },
  { a: 47.5,  b: 50.8,  zh: '只错一回的，可能只是运气' },
  { a: 51.6,  b: 54.9,  zh: '老周请来两位匠人，先读路书' },
  { a: 55.2,  b: 58.6,  zh: '铜匠只改{走法}：哪条路都用得上' },
  { a: 58.9,  b: 61.9,  zh: '他给蹄铁钉上防滑钉，顺手挂个铃' },
  { a: 62.2,  b: 65.5,  zh: '银匠只补{门道}：只管这片山' },
  { a: 65.8,  b: 69.1,  zh: '他系上路签：第三道弯，贴山壁走' },
  { a: 69.8,  b: 72.9,  zh: '改过的两副，各{试跑}一趟' },
  { a: 73.2,  b: 75.6,  zh: '都过了冰坡' },
  { a: 76.2,  b: 79.4,  zh: '老周把两边的改动，拼成一副' },
  { a: 79.7,  b: 83.0,  zh: '能在蹄印上指出用处的，留下', tone: 'gold' },
  { a: 83.3,  b: 86.2,  zh: '铃铛说不出用处，{!摘掉}' },
  { a: 86.8,  b: 90.1,  zh: '这样从头拼两回，得到两副马具' },
  { a: 90.4,  b: 93.6,  zh: '各送一趟，送回两个包裹' },
  { a: 94.0,  b: 97.3,  zh: '挑的人隔着帘子，只看包裹' },
  { a: 97.6,  b: 100.6, zh: '包裹上只写甲、乙' },
  { a: 100.9, b: 104.2, zh: '要挑哪个，先写下{理由}' },
  { a: 104.5, b: 107.9, zh: '从头到尾，没人拿着标准答案', tone: 'gold' },
  { a: 108.6, b: 111.6, zh: '最后，老周写日志' },
  { a: 111.9, b: 115.2, zh: '每样改动有没有用，各记一笔' },
  { a: 115.5, b: 118.9, zh: '再写一条：什么时候，该怎么做' },
  { a: 119.2, b: 122.2, zh: '一片山一本。雪岭的，只进雪岭' },
  { a: 122.8, b: 125.9, zh: '下一单，还是雪岭' },
  { a: 126.2, b: 129.2, zh: '头两趟，照样用原来的马具' },
  { a: 129.7, b: 133.0, zh: '可匠人动手前，先翻{日志}' },
  { a: 133.6, b: 136.8, zh: '这匹马，就是{大模型}' },
  { a: 137.1, b: 140.5, zh: '训练好了，权重一个都不改' },
  { a: 140.8, b: 144.2, zh: '马具，就是它外面那层 {harness}' },
  { a: 144.5, b: 147.9, zh: '路书是执行记录，两位匠人是编辑' },
  { a: 148.2, b: 151.6, zh: '一个任务里改马具，是第一层' },
  { a: 151.9, b: 155.4, zh: '靠日志越改越会改，是第二层' },
  { a: 155.7, b: 159.5, zh: '两层叠在一起，叫 {Harness²}', big: 1 },
  { a: 160.2, b: 163.6, zh: '论文里，只走一步，两个模型都变强' },
  { a: 163.9, b: 167.3, zh: '给每个任务多点预算，还能更好' },
  { a: 168.0, b: 170.8, zh: '马，还是那匹马' },
  { a: 171.1, b: 174.2, zh: '这回，它稳稳过了冰坡', tone: 'gold' },
];

/* 镜头表：[起, 止, 场景, 暗场?]。镜头之间暗一下（0.22s）；进片名、进揭晓是"压暗" */
const SHOTS = [
  [0, T.s2, CH.s1], [T.s2, T.ttl, CH.s2], [T.ttl, T.s3, CH.title, 1], [T.s3, T.s4, CH.s3],
  [T.s4, T.s5, CH.s4], [T.s5, T.s6, CH.s5], [T.s6, T.s7, CH.s6], [T.s7, T.s8, CH.s7],
  [T.s8, T.s8b, CH.s8a], [T.s8b, T.s9, CH.s8b], [T.s9, T.s10, CH.s9], [T.s10, T.s10b, CH.s10a], [T.s10b, T.s11, CH.s10b],
  [T.s11, T.s12, CH.s11, 1], [T.s12, T.s13, CH.s12, 1], [T.s13, T.end1, CH.s13], [T.end1, T.end, CH.endCard, 1],
];

function sounds(fr) {
  const step = (t0, t1, f = 7.6, g = .12) => { for (let k = Math.ceil(t0 * f / Math.PI) ; k * Math.PI / f < t1; k++) fr.sfx(+(k * Math.PI / f).toFixed(3), 'tick', { pitch: -12 + (k % 2) * 2, gain: g }); };
  /* 1 雪路 */ step(.2, 4.3); fr.sfx(4.3, 'thud', { gain: .9 }); fr.sfx(4.45, 'soft', { gain: .5 });
  /* 2 驿站 */ fr.sfx(10.25, 'stamp', { gain: .8 }); fr.sfx(11.6, 'shimmer', { gain: .35 });
  /* 片名 */ fr.sfx(T.ttl + .55, 'bloom', { root: 0, gain: .8 });
  /* 3 认马具 */ [21.0, 24.7, 25.6, 26.5, 27.4].forEach((t, i) => fr.sfx(t, 'tick', { pitch: 4 + i * 2, gain: .4 })); fr.sfx(28.7, 'chord', { root: 0, gain: .45 });
  /* 4 两趟 */ step(33.4, 37.2); step(38.6, 42.2); fr.sfx(37.2, 'thud', { gain: .85 }); fr.sfx(42.2, 'thud', { gain: .85 }); fr.sfx(35.1, 'soft', { gain: .35 });
  fr.sfx(43.7, 'chord', { root: -3, gain: .6 }); fr.sfx(47.5, 'soft', { gain: .45 });
  /* 5 两匠 */ CH.S5.HITS.forEach(h => fr.sfx(h, 'tock', { pitch: 3, gain: .7 })); fr.sfx(CH.S5.BELL, 'shimmer', { gain: .45 }); fr.sfx(CH.S5.SLIP[0], 'soft', { gain: .5 }); fr.sfx(CH.S5.SLIP[2], 'tick', { pitch: 7, gain: .4 });
  /* 6 试跑 */ step(CH.S6.PA[0], CH.S6.PA[1], 7.6, .1); step(CH.S6.PB[0], CH.S6.PB[1], 7.6, .1); fr.sfx(CH.S6.PA[1], 'chord', { root: 4, gain: .45 }); fr.sfx(CH.S6.PB[1], 'chord', { root: 7, gain: .45 });
  /* 7 拼合 */ fr.sfx(76.3, 'tick', { pitch: 5, gain: .4 }); fr.sfx(CH.S7.sp[0], 'rise', { dur: .8, gain: .35 }); fr.sfx(CH.S7.sl[0], 'rise', { dur: .8, gain: .35 }); fr.sfx(CH.S7.sp[2], 'tick', { pitch: 9, gain: .4 }); fr.sfx(CH.S7.sl[2], 'tick', { pitch: 11, gain: .4 });
  fr.sfx(CH.S7.bl[1], 'soft', { gain: .5 }); fr.sfx(CH.S7.bl[3], 'thud', { gain: .6 });
  /* 8 两副、盲选 */ fr.sfx(87.1, 'tick', { pitch: 5, gain: .4 }); fr.sfx(88.5, 'tick', { pitch: 7, gain: .4 }); fr.sfx(91.0, 'soft', { gain: .4 }); fr.sfx(91.6, 'soft', { gain: .4 });
  fr.sfx(97.6, 'tick', { pitch: 9, gain: .4 }); fr.sfx(101.1, 'soft', { gain: .4 }); fr.sfx(103.4, 'stamp', { gain: .8 }); fr.sfx(106.0, 'shimmer', { gain: .35 });
  /* 9 日志 */ CH.S9.ENT.forEach((t, i) => fr.sfx(t, 'tick', { pitch: i === 2 ? -2 : 6, gain: .4 })); fr.sfx(CH.S9.LES, 'soft', { gain: .45 }); fr.sfx(CH.S9.SHELF[1], 'thud', { gain: .5 });
  /* 10 下一单 */ fr.sfx(122.8, 'tick', { pitch: 4, gain: .35 }); fr.sfx(128.0, 'thud', { gain: .35 }); fr.sfx(128.8, 'thud', { gain: .35 }); fr.sfx(129.8, 'soft', { gain: .5 }); fr.sfx(130.8, 'shimmer', { gain: .35 });
  /* 11 揭晓 */ fr.sfx(T.s11 + .1, 'hush', { dur: .3 }); Object.entries(CH.RV).forEach(([k, t]) => { if (k !== 'name') fr.sfx(t, 'soft', { gain: .45 }); }); fr.sfx(CH.RV.lv1, 'chord', { root: 0, gain: .4 }); fr.sfx(CH.RV.lv2, 'chord', { root: 5, gain: .4 });
  fr.sfx(CH.RV.name, 'bloom', { root: 0, gain: .9 }); fr.sfx(CH.RV.name + .1, 'shimmer', { gain: .5 });
  /* 12 数字 */ [.7, 1.05, 1.4].forEach(d => fr.sfx(T.s12 + d, 'tick', { pitch: 7, gain: .45 })); fr.sfx(163.9, 'rise', { dur: 1, gain: .35 });
  /* 13 回场 */ step(T.s13, T.end1 - .3, 6.4, .1); fr.sfx(171.1, 'chord', { root: 0, gain: .55 });
  /* 片尾 */ fr.sfx(T.end1 + .3, 'bloom', { root: -5, gain: .7 });
}

VK.film({
  dur: T.end, theme: 'flat', meta: { title: '换马具', root: 0 },
  draw(fr, t) {
    fr.look.bgo = { color: '#17121E' };
    for (const sh of SHOTS) {
      if (t < sh[0] - .001 || t >= sh[1] + .001) continue;
      const first = sh[0] === 0, last = sh[1] >= T.end, fin = sh[3] || first ? .5 : .22, fout = last ? .6 : (SHOTS[SHOTS.indexOf(sh) + 1] || [])[3] ? .55 : .22;
      const cut = Math.min(first ? ss(t, 0, .5) : ss(t, sh[0], sh[0] + fin), 1 - ss(t, sh[1] - fout, sh[1]));
      if (cut <= 0) continue;
      fr.g({ a: cut }, () => {
        sh[2](fr, t);
        const x = fr.x, g = x.createRadialGradient(W / 2, 520, H * .55, W / 2, 520, W * .72); g.addColorStop(0, 'rgba(40,20,10,0)'); g.addColorStop(1, 'rgba(40,20,10,.42)'); fr.rect(0, 0, W, H, { fill: g });
        const b = x.createLinearGradient(0, 830, 0, H); b.addColorStop(0, 'rgba(18,12,20,0)'); b.addColorStop(.45, 'rgba(18,12,20,.7)'); b.addColorStop(1, 'rgba(18,12,20,.88)'); fr.rect(0, 830, W, 250, { fill: b });
      });
      break;
    }
    sounds(fr);
    K.subs(fr, t, SUBS, 'flat');
  },
});
})();
