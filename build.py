"""把 src/ 下的版式与章节拼成 index.html，并生成 docs/ 下的 Markdown 版（方便在 GitHub 上直接阅读）。

用法：python3 build.py
依赖：仅生成 Markdown 时需要 beautifulsoup4 + markdownify（pip install beautifulsoup4 markdownify）。
"""
import warnings
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
IMG = ROOT / "assets" / "img"
REPO = "https://github.com/google-research/harness2/blob/main/harness2/"
PRIO_LABEL = {"p0": "P0 核心主干", "p1": "P1 关键约束", "p2": "P2 工程地基", "pre": "导读"}
GROUPS = [("pre-start", "开始"), ("p0", "P0 · 核心主干（先学）"), ("p1", "P1 · 关键约束"), ("p2", "P2 · 工程地基"), ("pre-end", "收尾")]
META_RE = re.compile(r"^<!--meta\s+(\{.*?\})\s*-->", re.S)
SVG_RE = re.compile(r"<!--SVG:([\w-]+)\|(.*?)-->")


from bs4 import MarkupResemblesLocatorWarning
warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)


def load_chapters():
    out = []
    for f in sorted((SRC / "chapters").glob("*.html")):
        text = f.read_text(encoding="utf-8")
        m = META_RE.match(text)
        if not m:
            raise SystemExit(f"{f.name}: 缺少 <!--meta {{...}}--> 头")
        meta = json.loads(m.group(1))
        meta["file"] = f.stem
        meta["body"] = text[m.end():].strip()
        out.append(meta)
    return out


def svg_inline(name, caption):
    svg = (IMG / f"{name}.svg").read_text(encoding="utf-8")
    return f'<figure class="diagram" data-svg="{name}">\n{svg}<figcaption>{caption}</figcaption>\n</figure>'


def head(meta):
    prio = meta["prio"]
    parts = [f'<div class="ch-head"><span class="badge {prio if prio != "pre" else "ghost"}">{PRIO_LABEL[prio]}</span>'
             f'<span class="ch-no">{meta["no"]}</span></div>',
             f'<h2 class="ch-title">{meta["title"]}</h2>']
    if meta.get("concept") and prio != "pre":
        parts.append(f'<span class="concept-chip" title="读完寓言后点击揭晓">本站谜底：<span class="q">{meta["concept"]}</span></span>')
    if meta.get("src"):
        links = " ".join(f'<a href="{REPO}{s}" target="_blank" rel="noopener">{s}</a>' for s in meta["src"])
        parts.append(f'<div class="src-files">对应源码：{links}</div>')
    return "\n".join(parts)


def render_chapter(meta):
    body = SVG_RE.sub(lambda m: svg_inline(m.group(1), m.group(2)), meta["body"])
    body = body.replace("<!--REVEAL-->", f'<button class="reveal-btn" type="button" data-for="{meta["id"]}">揭开谜底：这个故事讲的是什么？</button>')
    cls = "chapter pre" if meta["prio"] == "pre" else "chapter"
    return f'<section class="{cls}" id="{meta["id"]}" data-prio="{meta["prio"]}">\n{head(meta)}\n{body}\n</section>'


def nav(chapters):
    lines = []
    for key, label in GROUPS:
        if key == "pre-start":
            items = [c for c in chapters if c["prio"] == "pre" and c["file"] < "05"]
        elif key == "pre-end":
            items = [c for c in chapters if c["prio"] == "pre" and c["file"] >= "05"]
        else:
            items = [c for c in chapters if c["prio"] == key]
        if not items:
            continue
        lines.append(f'    <div class="nav-group">{label}</div>')
        for c in items:
            plain = " plain" if c["prio"] == "pre" else ""
            no = c.get("short", c["no"][-2:])
            fable = f'《{c["fable"]}》' if c.get("fable") else c["title"]
            lines.append(f'    <a href="#{c["id"]}" class="{c["prio"]}" data-id="{c["id"]}"><span class="no">{no}</span>'
                         f'<span class="t">{fable}</span><span class="s{plain}">{c["concept"]}</span></a>')
    return "\n".join(lines)


def build_html(chapters):
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    page = layout.replace("<!--NAV-->", nav(chapters)).replace("<!--CHAPTERS-->", "\n".join(render_chapter(c) for c in chapters))
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print(f"index.html: {len(page.encode()) // 1024} KB, {len(chapters)} 章")


def build_md(chapters):
    try:
        from bs4 import BeautifulSoup
        from markdownify import MarkdownConverter
    except ImportError:
        print("跳过 Markdown：未安装 beautifulsoup4 / markdownify")
        return

    class Conv(MarkdownConverter):
        def convert_figure(self, el, text, *args, **kw):
            return f"\n\n{text.strip()}\n\n"

    docs = ROOT / "docs"
    docs.mkdir(exist_ok=True)
    index_lines = ["# 教程全文（Markdown 版）", "", "> 这是网页版的纯文字镜像，方便在 GitHub 上直接阅读。交互演示、谜底遮挡等效果请打开网页版：`index.html`。", ""]
    for c in chapters:
        body = SVG_RE.sub(lambda m: f'<figure><p><img src="../assets/img/{m.group(1)}.svg" alt="{html.escape(m.group(2))}"></p><p><em>图：{m.group(2)}</em></p></figure>', c["body"])
        body = body.replace("<!--REVEAL-->", '<p>MDREVEALMARK</p>')
        soup = BeautifulSoup(body, "html.parser")
        for w in soup.select(".widget"):
            t = w.get("data-title", "交互演示")
            w.replace_with(BeautifulSoup(f"<blockquote><p>🖐 动手演示「{t}」：请打开网页版体验。</p></blockquote>", "html.parser"))
        conv = Conv(heading_style="ATX", bullets="-")
        def inline_md(node):
            return re.sub(r"\s+", " ", conv.convert(node.decode_contents()) if node else "").strip()
        quiz_blocks = []
        for q in soup.select(".quiz"):
            ans = int(q.get("data-answer", "0"))
            qq = inline_md(q.select_one(".qq"))
            opts = [inline_md(o) for o in q.select(".opt")]
            letter = opts[ans].split(".")[0].strip() if ans < len(opts) else ""
            exp = re.sub(r"^" + re.escape(letter) + r"[。.．、:：]\s*", "", inline_md(q.select_one(".exp")))
            block = f"**小测：**{qq}\n\n" + "\n".join(f"- {o}" for o in opts) + \
                f"\n\n<details><summary>看答案</summary>\n\n**答案：{letter}**　{exp}\n\n</details>"
            quiz_blocks.append(block)
            q.replace_with(BeautifulSoup(f"<p>MDQUIZMARK{len(quiz_blocks) - 1}</p>", "html.parser"))
        for pre in soup.select("pre[data-file]"):
            label = soup.new_tag("p")
            label.string = f"📄 {pre['data-file']}"
            pre.insert_before(label)
        for d in soup.select(".fable"):
            d.insert(0, BeautifulSoup("<p><strong>【寓言】</strong></p>", "html.parser"))
        md = Conv(heading_style="ATX", bullets="-", code_language_callback=lambda el: (el.find("code") or el).get("class", ["language-"])[0].replace("language-", "") if (el.find("code") or el).get("class") else "").convert_soup(soup)
        md = re.sub(r"\n{3,}", "\n\n", md).strip()
        md = md.replace("MDREVEALMARK", "> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。\n\n---\n\n**【谜底揭晓】**")
        md = re.sub(r"MDQUIZMARK(\d+)", lambda m: quiz_blocks[int(m.group(1))], md)
        md = re.sub(r"`[^`\n]+`", lambda m: m.group(0).replace("\\_", "_").replace("\\*", "*"), md)
        title = f'{c["no"]}｜{c["title"]}'
        src = "、".join(f"[{s}]({REPO}{s})" for s in c.get("src", []))
        text = f"# {title}\n\n" + (f"对应源码：{src}\n\n" if src else "") + md + "\n"
        name = f'{c["file"]}.md'
        (docs / name).write_text(text, encoding="utf-8")
        index_lines.append(f'- [{c["no"]}｜{c["title"]}]({name})')
    (docs / "README.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")
    print(f"docs/: {len(chapters)} 篇 Markdown")


if __name__ == "__main__":
    chs = load_chapters()
    build_html(chs)
    build_md(chs)
