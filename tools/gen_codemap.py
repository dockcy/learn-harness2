"""生成 assets/img/codemap.svg：harness2 源码地图（按优先级着色）。"""
from html import escape

W, H = 1200, 700
CSS = """
.svg-code text { font-family: "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",sans-serif; fill:#2a2723; }
.svg-code .m { font-family: Menlo, Consolas, "JetBrains Mono", monospace; font-size: 14px; font-weight: 700; }
.svg-code .d { font-size: 12.5px; fill:#5a544b; }
.svg-code .n { font-size: 11.5px; fill:#8a8378; font-family: Menlo, Consolas, monospace; }
.svg-code .lay { font-size: 15px; font-weight: 800; }
.svg-code .p0 { fill:#fff; stroke:#c4402b; stroke-width:3.5; }
.svg-code .p1 { fill:#fbf0d9; stroke:#b9770e; stroke-width:2; stroke-dasharray:7 5; }
.svg-code .p2 { fill:#eef2f5; stroke:#8da0b0; stroke-width:1.2; }
.svg-code .ar { stroke:#7a7368; stroke-width:2.2; fill:none; marker-end:url(#cah); }
"""

def box(x, y, w, h, prio, mod, desc, lines="", target="", tip=""):
    tag = {"p0": "#c4402b", "p1": "#b9770e", "p2": "#52677a"}[prio]
    out = [f'<g class="clickable" data-target="{target}" data-tip="{escape(tip or desc)}">',
           f'<rect class="shape {prio}" x="{x}" y="{y}" width="{w}" height="{h}" rx="12"/>',
           f'<rect x="{x+w-38}" y="{y+8}" width="30" height="17" rx="8" fill="{tag}"/>',
           f'<text x="{x+w-23}" y="{y+21}" text-anchor="middle" style="font-size:10.5px;font-weight:800;fill:#fff">{prio.upper()}</text>',
           f'<text x="{x+12}" y="{y+24}" class="m">{escape(mod)}</text>']
    for i, ln in enumerate(desc.split("\n")):
        out.append(f'<text x="{x+12}" y="{y+46+i*18}" class="d">{escape(ln)}</text>')
    if lines:
        out.append(f'<text x="{x+w-10}" y="{y+h-9}" text-anchor="end" class="n">{escape(lines)}</text>')
    out.append('</g>')
    return "\n".join(out)

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" class="svg-code" viewBox="0 0 {W} {H}" role="img" aria-label="harness2 代码地图">',
         f'<style>{CSS}</style>',
         '<defs><marker id="cah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#7a7368"/></marker></defs>',
         '<text x="12" y="32" style="font-size:23px;font-weight:800">代码地图：一条命令是怎么走完的</text>',
         '<text x="1188" y="32" text-anchor="end" class="d">方框粗细 = 优先级；右下角是行数；点击跳到讲解它的那一站</text>']

# 层带
layers = [(52, "入口", "#8a8378"), (158, "驱动", "#b9770e"), (272, "方法核心", "#c4402b"), (420, "支撑", "#b9770e"), (552, "接缝之外", "#52677a")]
for y, name, col in layers:
    parts.append(f'<text x="14" y="{y+40}" class="lay" style="fill:{col}">{name}</text>')

# 入口层
parts.append(box(110, 52, 250, 78, "p2", "cli/run_sweep.py", "命令 harness2：解析参数\n→ schedule.run_sweep()", "239 行", "ch12"))
parts.append(box(375, 52, 200, 78, "p2", "cli/judge.py", "harness2-judge：选完后\n才打分（盲选之后）", "204 行", "ch7"))
parts.append(box(590, 52, 180, 78, "p2", "cli/report.py", "harness2-report：\n汇总报告", "114 行", "ch7"))
parts.append(box(785, 52, 190, 78, "p2", "cli/setup · check", "安装基准、预检\n（preflight）", "", "ch10"))
parts.append(box(990, 52, 198, 78, "p2", "demo.py", "离线演示：确定性的\n编辑器 + 真执行", "163 行", "final"))

# 驱动层
parts.append(box(110, 158, 1078, 84, "p1", "core/schedule.py", "run_sweep（多领域并发）→ run_domain（领域内按序、把经验库往后传）→ run_task（k 次基础执行 → 每种模式 → 盲选 → summary.json）\n→ _run_one_mode：run_mode → selection_pool → run_selection → reflect_adoption → Library.add", "850 行", "ch12",
                 "驱动层：命名空间、任务流顺序、断点续跑都在这里"))

# 方法核心层
y = 272; h = 118
parts.append(box(110, y, 230, h, "p0", "core/recursion.py", "run_parallel（宽）\nrun_sequential（深）\n_run_stage：提议+校验+重试", "578 行", "ch2"))
parts.append(box(352, y, 205, h, "p0", "core/selection.py", "run_selection 盲选\nreflect_adoption 反思\n_distil 提炼经验", "505 行", "ch4"))
parts.append(box(569, y, 190, h, "p0", "core/library.py", "Library：按领域\nadd / retain / INDEX.md\n存整套 harness", "222 行", "ch5"))
parts.append(box(771, y, 215, h, "p0", "core/prompts.py", "propose（INV / DOM）\naggregate / compose_round\nselect / experience", "1163 行", "ch3"))
parts.append(box(998, y, 190, h, "p0", "core/tree.py", "Tree = {路径: 内容}\nvalidate / autotrigger\nwrite_tree / diff", "427 行", "ch1"))

# 支撑层
y = 420; h = 104
parts.append(box(110, y, 255, h, "p1", "core/context.py", "build：把证据写成文件树\nmission：短短的“传票”\n防泄漏绊线", "546 行", "ch9"))
parts.append(box(377, y, 245, h, "p1", "core/proposer.py", "Proposer.call：在临时目录里\n跑一次改进会话\n按指纹缓存、harvest 改动", "534 行", "ch12"))
parts.append(box(634, y, 190, h, "p1", "core/ledger.py", "预算账本\nR = 4k 次执行\nP = 3k 次改进会话", "132 行", "ch6"))
parts.append(box(836, y, 352, h, "p1", "core/spec.py", "接缝：BenchmarkAdapter / SubstrateLike（Protocol）\nBenchSpec / ChannelSpec / BenchPrompts（frozen）\nRunView：一次执行的“视图”，从不带分数", "277 行", "ch10"))

# 接缝之外
y = 552; h = 100
parts.append(box(110, y, 270, h, "p2", "substrate/", "opencode.py（默认执行器）\ncodex.py（--substrate cx）\n把组件树装成框架原生文件", "395 + 480 行", "ch10"))
parts.append(box(392, y, 270, h, "p2", "benchmarks/", "lab.py · jobbench.py · workbuddy.py\n每个基准一个 Adapter\n（实现 Protocol 里的方法）", "", "ch10"))
parts.append(box(674, y, 250, h, "p2", "core/judge.py", "选完之后才打分\n“方法代码从不导入它”\n失败 = None，绝不当 0 分", "155 行", "ch7"))
parts.append(box(936, y, 252, h, "p2", "runmark.py · config.py", "完成标记 + harness 指纹\n全局配置：并发宽度 2、\n传输重试 2 次", "115 + 189 行", "ch12"))

# 层间箭头
for x in (235, 640, 1000):
    pass
arrows = [
    (235, 130, 235, 156), (640, 242, 640, 270), (240, 242, 240, 270), (1000, 242, 1000, 270),
    (225, 390, 225, 418), (460, 390, 480, 418), (720, 390, 720, 418), (880, 390, 900, 418),
    (1010, 524, 1010, 550), (245, 524, 245, 550),
]
for x1, y1, x2, y2 in arrows:
    parts.append(f'<path class="ar" d="M{x1},{y1} L{x2},{y2}"/>')
parts.append('<path d="M674,664 H924" stroke="#52677a" stroke-width="1.5" stroke-dasharray="4 4"/>')
parts.append('<text x="799" y="684" text-anchor="middle" class="d">↑ judge 与方法隔离：只在盲选“之后”运行</text>')
parts.append('</svg>')
open("assets/img/codemap.svg", "w", encoding="utf-8").write("\n".join(parts))
print("ok")
