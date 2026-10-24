# 第 8 站｜只标改动的裁缝

对应源码：[core/tree.py](https://github.com/google-research/harness2/blob/main/harness2/core/tree.py)、[core/recursion.py](https://github.com/google-research/harness2/blob/main/harness2/core/recursion.py)、[core/prompts.py](https://github.com/google-research/harness2/blob/main/harness2/core/prompts.py)

**【寓言】**

### 只标改动的裁缝

城里有家改衣铺，衣服由跑腿的送来，改好再由跑腿的送回去。

铺子的规矩是：小裁缝**直接在原衣服上改**。没动的针脚，原样保留；不许为了“保持原样”把整件拆了重缝一遍；要去掉一个口袋，就把口袋拆下来。“客人要的尺寸和样式，一分都不能动——你能改的是穿着舒不舒服，不是衣服的模样。”

改完不能直接送走。老师傅会拿着一张单子**逐条验**：领口的绣花加起来不能太重，否则穿的人抬不起头；每个暗袋都得缝上标签，标签上的名字要和口袋对得上，领口还得绣一行小字告诉穿的人“遇到什么情况，掏哪个暗袋”——“没人知道的暗袋，就是白添的分量。”口袋里的纸条写着“用口袋里的小剪刀”，那剪刀就必须真在口袋里；拉链要真能拉得动。缝到衣服外面去的东西，比如缝在跑腿的包上的，一律不算数。

有时候暗袋没绣提示，老师傅会顺手在领口补一行；可领口要是已经绣满了，他也补不了。

验不过，老师傅不会只说一句“不行”。他把**所有**问题一条一条抄在一张纸条上，原话照抄，和衣服一起退回去：“上次退回的原因如下，改好再交。”小裁缝只有**一次**返工机会。再验不过，客人就拿回原来那件衣服。

也有小裁缝看了半天，一针没动，附了张字条：“这件不需要改。”老师傅照样收下——“不该改的不改，也是手艺。”

猜一猜：这家铺子的“直接在原件上改、没动的原样保留、交货前逐条验、退回时附原话”，对应 Harness² 的哪套机制？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：编辑契约 + 校验—回灌—重试

编辑器**直接在 harness 副本上改文件**：磁盘上的改动就是提议，没碰的文件原样继承。交回后，代码先**自动补触发行**，再跑**三道校验**（表面规则、基准规则、评分绊线）。不通过就把**全部错误原文**回灌给编辑器，重试一次；还不行就退回保底树。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 直接在原衣服上改 | “Your edits on disk ARE the proposal”——在 `context/harness/` 里原地改 |
| 没动的针脚原样保留 | “Files you do not touch are inherited unchanged.” |
| 去掉口袋就拆下来 | “Delete a file to remove that component.” |
| 尺寸样式一分不能动 | harness 只能改代理**怎么做**，绝不能改交付物的**形状**（字段、列、表、章节、顺序） |
| 领口绣花不能太重 | 常驻内容上限（OpenCode 24,000 / Codex 8,000） |
| 暗袋要有标签、名字对得上 | 技能必须有 `description:`；`name:` 必须与目录一致 |
| 没人知道的暗袋是白添分量 | 未在常驻文字中点名的技能 = dead weight |
| 老师傅顺手补一行提示 | `autotrigger`：在 `guardrails.md` 补 “- When …, load the `x` skill.” |
| 纸条提到的剪刀必须真在口袋里 | 被调用的脚本必须随 harness 一起提供 |
| 拉链要真能拉动 | Python 脚本必须能编译 |
| 缝在跑腿包上的不算数 | 可编辑表面之外的路径被拒绝并列出 |
| 所有问题原话抄在一张纸条上 | 所有错误用 “ | ” 连成一条，原文回灌 |
| 一次返工机会，再不行拿回原件 | `STAGE_ATTEMPTS = 2`；失败则 `fell_back=True` |
| “这件不需要改” | `KEEP_BASE` → `kept_base=True` |

### 校验清单（OpenCode 表面）

| 检查 | 不通过时的报错（原文节选） |
| --- | --- |
| 常驻内容超长 | always-on content is N chars, over the 24000 cap; every token here competes with … |
| 技能缺 description | skills/x/SKILL.md needs a `description:` in its frontmatter, or the skill is dropped SILENTLY at load |
| 技能 name 与目录不符 | … needs frontmatter `name: x` matching its directory (a mismatch is dropped SILENTLY at load) |
| 技能没被点名 | skill 'x' is never named in the always-on text … an untriggered skill is dead weight. |
| 子代理缺字段 | sub\_agents/x/AGENT.md needs frontmatter `mode: subagent` / needs a `description:` |
| 脚本编译失败 | scripts/x.py does not compile: … |
| 引用的脚本不存在 | guardrails.md invokes `scripts/x.py` but that file is not in the harness |
| Codex 钩子格式 | .codex/hooks.json needs a top-level {"hooks": …} object 等 |

注意两个“静默”：技能缺 description 或名字不符，执行器在加载时会**悄无声息地丢掉**它——不报错、不提示。Harness² 的校验器把这些“静默失败”提前变成响亮的错误，这是整个校验设计的出发点。

📄 harness2/core/tree.py · validate / autotrigger（节选，中文注释为本教程所加）

```python
def validate(surface, tree, *, allow_subagents=True, always_on_max=None, reserved_scripts=...) -> dict:
    """抛出 ValueError，列出【每一个】问题；通过则返回这棵树的统计。"""
    errs: list[str] = []
    body = always_on_text(surface, tree)
    if len(body) > cap:
        errs.append(f"always-on content is {len(body)} chars, over the {cap} cap; "
                    f"{surface.always_on_cap_reason}")
    skills = _check_skills(surface, tree, body, errs)        # description / name / 是否被点名
    subs = _check_subagents(surface, tree, allow_subagents, errs)
    for rel, src in tree.items():                            # 脚本必须能编译
        if r["script"].fullmatch(rel) ...:
            _py_compiles(rel, src, errs)
    _check_script_refs(surface, tree, r, reserved_scripts, errs)   # 提到的脚本必须存在
    if errs:
        raise ValueError(" | ".join(errs))                   # 不是遇错即停，而是攒齐一次报完

def autotrigger(surface, tree, *, always_on_max=None) -> list[str]:
    """给每个技能在常驻文字里补一行触发；返回修好的技能名。
    如果补这一行会超出常驻上限，就跳过。"""
    for name in skill_names(surface, tree):
        if name in body:
            continue                                         # 已被点名
        ...
        line = surface.trigger_line.format(name=name, desc=desc)
        if len(always_on_text(surface, tree)) + len(line) + 2 > cap:
            continue                                         # 领口绣满了：补不了，留给 validate 报错
        tree[surface.autotrigger_file] = ... + line
```

**设计要点：错误信息是写给模型看的**适配器接口里 `validate_tree` 的文档写着：“Raise ValueError listing all problems in actionable prose: the message is fed back verbatim as retry feedback.” 所以每条报错都写成**可执行的修改建议**（比如“去掉 name: 行，或改成 name: x”），而且一次列出全部问题——编辑器只有一次返工机会，不能让它改了一个又撞上下一个。

**先修再验**`_accept_tree` 的顺序是：先 `autotrigger`（能自动修的先修掉），再 diff 判断是否原样保留，最后依次跑 `tree.validate` → `adapter.validate_tree`（基准自己的规则）→ `assert_tree_has_no_grader_verdicts`（第 7 站的绊线）。能机械修好的不浪费一次重试。

> 🖐 动手演示「校验器操练场」：请打开网页版体验。

**小测：**编辑器新增了 `skills/doc_review/SKILL.md`（有 name 和 description），但常驻文字里没提到它，而且常驻内容只差 10 个字符就到上限。会发生什么？

- A. autotrigger 补一行触发，顺利通过
- B. autotrigger 放不下这一行而跳过，validate 报“untriggered skill is dead weight”，带着错误重试
- C. 技能被静默丢弃，不报错
- D. 自动删掉一部分常驻内容来腾地方

<details><summary>看答案</summary>

**答案：B**　自动补触发行会检查上限，放不下就跳过；随后校验器发现技能没被点名，报错并给出修法：在 systemprompt.md 或 guardrails.md 加一行 “When <情况>, load the `doc_review` skill.”。编辑器重试时需要自己删减常驻内容腾出位置。

</details>

**本站带走三句话**

- 编辑契约：原地改、没碰的继承、删文件即删组件；只改怎么做，不改交付物的形状。
- 先自动修（补触发行），再三道校验；所有错误攒齐、原文回灌，只重试一次。
- 校验的核心价值是把执行器的“静默丢弃”变成响亮、可执行的错误。
