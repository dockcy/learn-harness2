"""生成第1站组件图、第2站单步流程图、第6站并行/串行对照图（全部中文）。

用法：python3 tools/gen_diagrams.py   （输出到 assets/img/）
"""
from html import escape
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "img"
FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",sans-serif'
MONO = 'Menlo, Consolas, "JetBrains Mono", monospace'


def svg(cls, w, h, label, css, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" class="{cls}" viewBox="0 0 {w} {h}" role="img" aria-label="{escape(label)}">\n'
            f'<style>.{cls} text{{font-family:{FONT};fill:#2a2723}} .{cls} .m{{font-family:{MONO}}} {css}</style>\n'
            '<defs><marker id="ah-' + cls + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
            '<path d="M0,0 L10,5 L0,10 z" fill="#6f685d"/></marker>'
            '<marker id="ahr-' + cls + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
            '<path d="M0,0 L10,5 L0,10 z" fill="#c4402b"/></marker></defs>\n'
            + "\n".join(body) + "\n</svg>\n")


def t(x, y, s, cls="", anchor="start", style=""):
    a = f' class="{cls}"' if cls else ""
    st = f' style="{style}"' if style else ""
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}"{a}{st}>{escape(s)}</text>'


# ---------------------------------------------------------------- 组件图
def components():
    W, H = 1200, 660
    css = (".svg-comp .ct{font-size:15px;font-weight:800} .svg-comp .cp{font-size:12px;fill:#6b655b} "
           ".svg-comp .cf{font-size:12.5px;fill:#4a453e} .svg-comp .gh{font-size:14px;font-weight:800} "
           ".svg-comp .badge{font-size:11px;font-weight:800;fill:#fff} .svg-comp .card{fill:#fffdf8;stroke-width:2}")
    b = [t(20, 34, "第1站｜一副“马具”的八个部件（以默认执行器 OpenCode 为例）", style="font-size:22px;font-weight:800"),
         t(1180, 34, "点击任一部件看详解", anchor="end", style="font-size:13px;fill:#6b655b")]
    groups = {
        "ctx": ("上下文构建", "#2f6f5e"),
        "tool": ("工具接口", "#6a4c93"),
        "orch": ("编排", "#2d5b8a"),
        "mid": ("中间件", "#8a6d1f"),
    }
    when_col = {"常驻": "#2f6f5e", "按需": "#5f8f3e", "调用时": "#6a4c93", "委派": "#2d5b8a", "循环内": "#8a6d1f"}
    cards = [
        # id, group, x, y, 中文名, 路径, 寓言, 时机, 说明
        ("c1", "ctx", 20, 70, "C1 系统提示", "systemprompt.md", "寓言：每趟出发前念的话", "常驻", "身份、目标、做事顺序"),
        ("c2", "ctx", 20, 200, "C2 护栏", "guardrails.md", "寓言：路口挂的红布", "常驻", "必须做 / 绝不做；技能触发行也写在这"),
        ("c3", "ctx", 20, 330, "C3 长期记忆", "LongTermMEMORY.md", "寓言：驿站的路书", "常驻", "跨任务稳定成立的经验"),
        ("c6", "ctx", 20, 460, "C6 技能", "skills/<名>/SKILL.md", "寓言：锦囊", "按需", "被点名才加载的完整流程"),
        ("c4", "tool", 820, 70, "C4 工具说明", "tool_descriptions/tool_guidance.md", "寓言：岔路口的木牌", "常驻", "什么时候用哪个工具、怎么用"),
        ("c7", "tool", 820, 200, "C7 脚本", "scripts/<名>.py", "寓言：秤与尺", "调用时", "经 bash 运行的确定性小工具"),
        ("c5", "orch", 820, 330, "C5 子代理", "sub_agents/<名>/AGENT.md", "寓言：派出去的小驹", "委派", "用 task 工具派活，自带独立上下文"),
        ("c8", "mid", 820, 460, "C8 插件", "plugin/<名>.ts", "寓言：蹄铁里的机关", "循环内", "在工具循环内部生效，模型跳不过"),
    ]
    cw, ch = 360, 112
    cx, cy = 600, 340
    # 连线
    for cid, g, x, y, *_ in cards:
        col = groups[g][1]
        sx = x + cw if x < 600 else x
        b.append(f'<path d="M{sx},{y+ch/2} L{cx + (-118 if x < 600 else 118)},{cy + (y + ch/2 - cy) * 0.35}" stroke="{col}" stroke-width="1.6" stroke-dasharray="4 4" fill="none" opacity=".7"/>')
    # 中心：冻结的模型
    b.append(f'<circle cx="{cx}" cy="{cy}" r="170" fill="none" stroke="#b8ae9c" stroke-width="1.5" stroke-dasharray="6 6"/>')
    b.append(t(cx, cy - 178, "harness = 一棵文件树  dict[路径, 内容]", anchor="middle", style="font-size:13px;fill:#6b655b"))
    b.append(f'<circle cx="{cx}" cy="{cy}" r="112" fill="#efe9dd" stroke="#6f685d" stroke-width="2.5"/>')
    # 锁
    b.append(f'<rect x="{cx-22}" y="{cy-62}" width="44" height="34" rx="6" fill="#6f685d"/>')
    b.append(f'<path d="M{cx-13},{cy-62} v-12 a13,13 0 0 1 26,0 v12" fill="none" stroke="#6f685d" stroke-width="6"/>')
    b.append(f'<circle cx="{cx}" cy="{cy-46}" r="5" fill="#efe9dd"/>')
    b.append(t(cx, cy + 2, "冻结的模型", anchor="middle", style="font-size:24px;font-weight:800"))
    b.append(t(cx, cy + 28, "权重一个不改", anchor="middle", style="font-size:14px;fill:#4a453e"))
    b.append(t(cx, cy + 50, "（马不能换）", anchor="middle", style="font-size:13px;fill:#6b655b"))
    # 卡片
    for cid, g, x, y, name, path, fable, when, desc in cards:
        gname, col = groups[g]
        tip = f"{name}｜{path}｜{when}：{desc}"
        b.append(f'<g class="clickable comp" data-comp="{cid}" data-tip="{escape(tip)}">')
        b.append(f'<rect class="shape card" x="{x}" y="{y}" width="{cw}" height="{ch}" rx="12" stroke="{col}"/>')
        b.append(f'<rect x="{x}" y="{y}" width="8" height="{ch}" rx="4" fill="{col}"/>')
        b.append(t(x + 20, y + 26, name, "ct", style=f"fill:{col}"))
        wc = when_col[when]
        b.append(f'<rect x="{x+cw-64}" y="{y+10}" width="54" height="20" rx="10" fill="{wc}"/>')
        b.append(t(x + cw - 37, y + 24, when, "badge", anchor="middle"))
        b.append(t(x + 20, y + 49, path, "m cp", style="font-size:12.5px;fill:#5a544b"))
        b.append(t(x + 20, y + 72, desc, "cf"))
        b.append(t(x + 20, y + 96, fable, "cp", style="fill:#9a6b2f"))
        b.append(t(x + cw - 12, y + 96, gname, "cp", anchor="end", style=f"fill:{col};font-weight:700"))
        b.append("</g>")
    # 底部说明
    b.append(f'<rect x="20" y="590" width="1160" height="56" rx="10" fill="#f6efe2" stroke="#d9cdb6"/>')
    b.append(t(36, 613, "常驻四件（C1–C4）每次调用都整段塞进上下文，合计 ≤ 24,000 字符 —— “这里的每个字，都在和代理自己的输出预算抢位置”。", style="font-size:13.5px"))
    b.append(t(36, 635, "换成 Codex 执行器：常驻只有 AGENTS.md 一个文件，上限 8,000；技能放 .agents/skills/；钩子写 .codex/hooks.json；没有 plugin 目录。", style="font-size:13px;fill:#5a544b"))
    return svg("svg-comp", W, H, "harness 的八个组件围绕冻结的模型", css, b)


# ---------------------------------------------------------------- 单步流程图
def ppc():
    W, H = 1200, 540
    css = (".svg-ppc .bt{font-size:15px;font-weight:800} .svg-ppc .bd{font-size:12.5px;fill:#4a453e} "
           ".svg-ppc .bx{fill:#fffdf8;stroke:#6f685d;stroke-width:1.8} .svg-ppc .ok{fill:#eaf4ea;stroke:#3d7a46;stroke-width:2.2} "
           ".svg-ppc .bad{fill:#fbecea;stroke:#c4402b;stroke-width:2.2} .svg-ppc .fb{fill:#eef2f5;stroke:#52677a;stroke-width:1.8} "
           ".svg-ppc .ar{stroke:#6f685d;stroke-width:2.2;fill:none;marker-end:url(#ah-svg-ppc)} "
           ".svg-ppc .arr{stroke:#c4402b;stroke-width:2.2;fill:none;stroke-dasharray:7 5;marker-end:url(#ahr-svg-ppc)} "
           ".svg-ppc .stp.hl .shape{stroke:#c4402b;stroke-width:4} .svg-ppc .stp.dim{opacity:.28} .svg-ppc .stp{transition:opacity .3s}")
    b = [t(20, 32, "一次“改进会话”在代码里怎么走：recursion._run_stage()", style="font-size:21px;font-weight:800"),
         t(1180, 32, "INV / DOM / 合成，用的都是这同一条流程", anchor="end", style="font-size:13px;fill:#6b655b")]

    def box(sid, x, y, w, h, title, lines, cls="bx"):
        b.append(f'<g class="stp" id="ppc-{sid}">')
        b.append(f'<rect class="shape {cls}" x="{x}" y="{y}" width="{w}" height="{h}" rx="12"/>')
        b.append(t(x + 14, y + 26, title, "bt"))
        for i, ln in enumerate(lines):
            b.append(t(x + 14, y + 49 + i * 19, ln, "bd" + (" m" if ln.startswith("`") else "")))
        b.append("</g>")

    y1, y2, y3, h = 80, 255, 420, 104
    xs = [30, 325, 620, 915]
    w = 255
    box("s1", xs[0], y1, w, h, "① 搭证据树", ["context.build(...)", "任务 + 基础执行轨迹 + 交付物", "+ 当前 harness + 经验库 → 目录"])
    box("s2", xs[1], y1, w, h, "② 写“传票”", ["context.mission(tree, job)", "几行字：目录在哪、要干什么", "“去读它，别只凭这条消息作答”"])
    box("s3", xs[2], y1, w, h, "③ 开一次改进会话", ["prop.call(...)", "编辑器在临时副本里读证据，", "直接改 context/harness/ 里的文件"])
    box("s4", xs[3], y1, w, h, "④ 把文件收回来", ["read_tree(...)", "整个目录空了 → 拒", "越界路径 → 拒，并列出文件名"])
    box("s5", 915, y2, 255, h, "⑤ 自动补触发行", ["autotrigger(...)", "没被点名的技能，在 guardrails.md", "补一行 “When …, load the `x` skill.”"])
    box("s6", 625, y2, 250, h, "⑥ 三道校验", ["tree.validate：上限/技能/脚本…", "adapter.validate_tree：基准自查", "绊线：不许带任何评分痕迹"])
    # 菱形
    dx, dy = 525, y2 + h / 2
    b.append('<g class="stp" id="ppc-d">')
    b.append(f'<path class="shape bx" d="M{dx},{dy-50} L{dx+72},{dy} L{dx},{dy+50} L{dx-72},{dy} z"/>')
    b.append(t(dx, dy + 6, "通过？", "bt", anchor="middle"))
    b.append("</g>")
    box("ok", 30, y2, 375, h, "✔ 接受这棵新树", ["返回 Stage(tree=新树, notes=说明)", "一处没改 → kept_base=True：", "“保留原样”也是正经答案，不算失败"], "ok")
    box("s7", 365, y3, 320, h, "⑦ 把错误原文贴回去", ["# YOUR PREVIOUS ATTEMPT WAS REJECTED", "+ 全部错误（用 “ | ” 连成一行）", "+ “去 context/harness/ 改好再回复”"], "bad")
    box("s8", 30, y3, 270, h, "⑧ 退回保底树", ["fell_back=True，用 fallback：", "并行 = 基础 harness", "串行 = 当前检查点"], "fb")
    # 箭头
    for i in range(3):
        b.append(f'<path class="ar" d="M{xs[i]+w},{y1+h/2} L{xs[i+1]-4},{y1+h/2}"/>')
    b.append(f'<path class="ar" d="M{xs[3]+w/2},{y1+h} L{xs[3]+w/2},{y2-4}"/>')
    b.append(f'<path class="ar" d="M915,{y2+h/2} L{875+4},{y2+h/2}"/>')
    b.append(f'<path class="ar" d="M625,{y2+h/2} L{dx+72+4},{dy}"/>')
    b.append(f'<path class="ar" d="M{dx-72},{dy} L{405+4},{dy}"/>')
    b.append(t((dx - 72 + 405) / 2, dy - 8, "是", anchor="middle", style="font-size:13px;font-weight:800;fill:#3d7a46"))
    b.append(f'<path class="arr" d="M{dx},{dy+50} L{dx},{y3-4}"/>')
    b.append(t(dx + 10, dy + 78, "否", style="font-size:13px;font-weight:800;fill:#c4402b"))
    # 重试回路
    b.append(f'<path class="arr" d="M685,{y3+h/2} L1185,{y3+h/2} L1185,48 L{xs[2]+w/2},48 L{xs[2]+w/2},{y1-4}"/>')
    b.append(t(1000, y3 + h / 2 - 8, "带着错误再开一次会话", anchor="middle", style="font-size:13px;fill:#c4402b;font-weight:700"))
    b.append(t(1000, y3 + h / 2 + 20, "（STAGE_ATTEMPTS = 2，最多两次）", anchor="middle", style="font-size:12.5px;fill:#c4402b"))
    b.append(f'<path class="ar" d="M365,{y3+h/2} L{300+4},{y3+h/2}"/>')
    b.append(t(333, y3 + h / 2 - 8, "仍不行", anchor="middle", style="font-size:12px;fill:#52677a"))
    return svg("svg-ppc", W, H, "改进会话的单步流程", css, b)


# ---------------------------------------------------------------- 并行 vs 串行
def modes():
    W, H = 1200, 660
    css = (".svg-modes .pt{font-size:18px;font-weight:800} .svg-modes .pc{font-size:13px;fill:#5a544b} "
           ".svg-modes .chip{font-size:12.5px;font-weight:700} .svg-modes .sm{font-size:12px;fill:#6b655b} "
           ".svg-modes .ln{stroke:#b8ae9c;stroke-width:1;fill:none} .svg-modes .ar{stroke:#6f685d;stroke-width:2;fill:none;marker-end:url(#ah-svg-modes)} "
           ".svg-modes .hist{stroke:#9a6b2f;stroke-width:1.6;fill:none;stroke-dasharray:5 5;marker-end:url(#ah-svg-modes)}")
    C = {"base": ("#e9e4da", "#6f685d"), "inv": ("#e3eef6", "#2d5b8a"), "dom": ("#f3e8f1", "#8a3f7a"),
         "fin": ("#fff3df", "#b9770e"), "pool": ("#fbecea", "#c4402b")}
    b = []

    def chip(x, y, w, label, kind, roll=True, h=26):
        fill, stroke = C[kind]
        b.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>')
        b.append(t(x + w / 2, y + h / 2 + 4.5, label, "chip m", anchor="middle", style=f"fill:{stroke}"))
        if roll:
            b.append(f'<path d="M{x+w+5},{y+h/2-6} l9,6 l-9,6 z" fill="#3d7a46"/>')

    # ---- 并行
    b.append(f'<rect x="10" y="12" width="1180" height="310" rx="14" fill="#fbf8f2" stroke="#d9cdb6"/>')
    b.append(t(28, 42, "并行模式 agg（求“宽”）· 以 k = 3 为例", "pt"))
    b.append(t(1172, 42, "执行 R = 3 + 6 + 3 = 12 = 4k　｜　改进会话 P = 6 + 3 = 9 = 3k", "pc", anchor="end"))
    for i in range(3):
        chip(30, 110 + i * 46, 96, f"base{i+1}", "base")
    b.append(t(78, 92, "基础执行 ×k", "sm", anchor="middle"))
    props = []
    for i in range(3):
        for j, d in enumerate(("inv", "dom")):
            y = 66 + (i * 2 + j) * 38
            chip(250, y, 92, f"{d}{i+1}", d)
            props.append(y + 13)
    b.append(t(296, 300, "第一阶段：2k 个独立提议", "sm", anchor="middle"))
    b.append(t(296, 316, "（读同一份证据，各跑一次）", "sm", anchor="middle"))
    for i in range(3):
        for py in props:
            b.append(f'<path class="ln" d="M144,{123+i*46} L250,{py}"/>')
    aggs = []
    for i in range(3):
        y = 100 + i * 60
        chip(600, y, 100, f"agg{i+1}", "fin")
        aggs.append(y + 13)
    for py in props:
        for ay in aggs:
            b.append(f'<path class="ln" d="M356,{py} L600,{ay}"/>')
    b.append(t(650, 300, "第二阶段：k 个独立合成", "sm", anchor="middle"))
    b.append(t(650, 316, "（都看全部候选，彼此看不见，不求共识）", "sm", anchor="middle"))
    b.append(f'<rect x="880" y="98" width="290" height="152" rx="12" fill="{C["pool"][0]}" stroke="{C["pool"][1]}" stroke-width="2"/>')
    b.append(t(1025, 126, "盲选池（第4站）", anchor="middle", style="font-size:15px;font-weight:800;fill:#c4402b"))
    for i in range(3):
        chip(905 + i * 88, 146, 70, f"agg{i+1}", "fin", roll=False)
    b.append(t(1025, 202, "只放 k 个最终候选", "sm", anchor="middle"))
    b.append(t(1025, 222, "基础执行和中间提议都不进池", "sm", anchor="middle"))
    b.append(f'<path class="ar" d="M720,{aggs[1]} L876,{aggs[1]}"/>')

    # ---- 串行
    oy = 338
    b.append(f'<rect x="10" y="{oy}" width="1180" height="310" rx="14" fill="#fbf8f2" stroke="#d9cdb6"/>')
    b.append(t(28, oy + 30, "串行模式 seq（求“深”）· 以 k = 3 为例", "pt"))
    b.append(t(1172, oy + 30, "执行 R = 3 + 6 + 3 = 12 = 4k　｜　改进会话 P = 6 + 3 = 9 = 3k", "pc", anchor="end"))
    for i in range(3):
        chip(30, oy + 92 + i * 46, 96, f"base{i+1}", "base")
    b.append(t(78, oy + 74, "基础执行 ×k", "sm", anchor="middle"))
    b.append(t(78, oy + 250, "（和并行共用同一组）", "sm", anchor="middle"))
    prev_out = (144, oy + 151)
    rx = [200, 440, 680]
    for r in range(3):
        x = rx[r]
        b.append(f'<rect x="{x}" y="{oy+62}" width="210" height="168" rx="12" fill="none" stroke="#cfc4ae" stroke-dasharray="5 4"/>')
        b.append(t(x + 105, oy + 82, f"第 {r+1} 轮", anchor="middle", style="font-size:13px;font-weight:800;fill:#6b655b"))
        chip(x + 16, oy + 102, 74, f"inv{r+1}", "inv")
        chip(x + 16, oy + 150, 74, f"dom{r+1}", "dom")
        chip(x + 120, oy + 126, 66, f"c{r+1}", "fin")
        b.append(f'<path class="ar" d="M{x+104},{oy+115} L{x+118},{oy+135}"/>')
        b.append(f'<path class="ar" d="M{x+104},{oy+163} L{x+118},{oy+145}"/>')
        b.append(f'<path class="ar" d="M{prev_out[0]},{prev_out[1]} L{x+14},{oy+139}"/>')
        prev_out = (x + 200, oy + 139)
        b.append(t(x + 105, oy + 216, "从上一个检查点出发" if r else "从基础 harness 出发", "sm", anchor="middle"))
    b.append(f'<path class="hist" d="M305,{oy+232} C305,{oy+282} 785,{oy+282} 785,{oy+234}"/>')
    b.append(t(545, oy + 290, "后面的轮次能看到之前所有候选和检查点（可复用、可捡回被拒的改动）", "sm", anchor="middle", style="fill:#9a6b2f"))
    b.append(f'<rect x="930" y="{oy+86}" width="240" height="140" rx="12" fill="{C["pool"][0]}" stroke="{C["pool"][1]}" stroke-width="2"/>')
    b.append(t(1050, oy + 114, "盲选池（第4站）", anchor="middle", style="font-size:15px;font-weight:800;fill:#c4402b"))
    for i in range(3):
        chip(948 + i * 72, oy + 132, 58, f"c{i+1}", "fin", roll=False)
    b.append(t(1050, oy + 186, "每一轮的检查点都进池", "sm", anchor="middle"))
    b.append(t(1050, oy + 206, "证据始终是同一组基础执行", "sm", anchor="middle"))
    b.append(f'<path class="ar" d="M890,{oy+139} L926,{oy+139}"/>')
    # 图例
    b.append(f'<path d="M990,{oy-38} l9,6 l-9,6 z" fill="#3d7a46"/>')
    b.append(t(1172, oy - 27, "= 用这棵 harness 真跑一次任务", "sm", anchor="end"))
    return svg("svg-modes", W, H, "并行模式与串行模式对照", css, b)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in (("components", components), ("ppc", ppc), ("modes", modes)):
        (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
        print("wrote", name)
