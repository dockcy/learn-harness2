# 第 3 站｜钟楼的两把钥匙

对应源码：[core/prompts.py](https://github.com/google-research/harness2/blob/main/harness2/core/prompts.py)

**【寓言】**

### 钟楼的两把钥匙

修钟匠老许一年到头在路上，哪个镇子的钟楼出了毛病，就请他去。每个镇子他都是头一回去。

他带两个徒弟，各发一把钥匙。**铜钥匙**开机芯舱：发条、齿轮、擒纵，一座钟“怎么走”全在里面。**银钥匙**开镇公所的历书柜：这个镇子的节气、集日、什么时辰敲几下，一座钟“该怎么报”全在里面。

老许定了条死规矩：“各管各的锁。拿铜钥匙的不许翻历书，拿银钥匙的不许碰齿轮。”

这回到了青石镇。拿铜钥匙的大徒弟发现，机芯每晚都在同一颗齿上打滑。他想装个卡簧，老许拦住了：“先用最省事的法子。只是上弦顺序错了，就在舱门上贴张条子；要是每天都得数一遍齿，就做个量规；冬至才用得上的那套校准，装进信封写上‘冬至拆’；只有贴了条子还反复被人无视，才上锁扣——而且锁扣不能把正常上弦也锁死。”

拿银钥匙的二徒弟发现，青石镇按旧历赶集，集日要连敲三下，这座钟对此一无所知。他把集日规矩誊进历书。老许翻了翻，又提了两点：“这页规矩，写成‘逢集日翻到这页’，别抄到历书扉页上——扉页人人每天都要念，多一行就得删一行。还有，‘今年腊月初八有庙会’别往里写，那是今年的事，明年就成了错的。”

临走前，老许把两个徒弟的改法合在一起，又在箱子里留了张单子给下一个镇子：哪些是**青石镇才有的**，哪些是**到哪都用得上的**，分开写，标清楚。

猜一猜：铜钥匙和银钥匙，对应 Harness² 里哪两个“提议方向”？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：INV 与 DOM —— 两个分工明确的提议维度

**INV（铜钥匙）管“代理怎么干活”**：流程、工具使用、怎样算做完——不碰专业内容。**DOM（银钥匙）管“行家知道什么”**：交付物该长什么样、给谁看、为谁做决定、权威来源、必备结构、一致性关系、行家知道要省掉什么——不碰流程。两类编辑器读同一份证据、**各出一版**候选，最后由合成器合并。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 铜钥匙 · 机芯舱 | INV 维度：how the agent WORKS |
| 银钥匙 · 历书柜 | DOM 维度：what a PRACTITIONER knows |
| “各管各的锁” | 两份提示词互相禁止越界：“另一个并行候选负责它” |
| 贴条子 / 量规 / 冬至信封 / 锁扣 | 常驻提示 / 脚本 / 技能 / 循环内杠杆（插件或钩子） |
| 锁扣不能把正常上弦锁死 | It must not block valid completion. |
| 别抄到扉页上，多一行就删一行 | 领域知识默认放技能；常驻记忆每次都付费：if you add some, cut some |
| “今年腊月初八有庙会”别写 | 本案事实不能存成长期记忆：它会成为下个任务的错误锚点 |
| 分开写“本镇才有的”和“到哪都用得上的” | GENERALIZE：工作区事实标注清楚；流程按“领域”来写 |

### INV：失败类型 → 最便宜的有效部件

INV 编辑器的任务是：顺着流程找到**最早出现的偏差**，把每个失败对应到最便宜的有效部件。

| 失败类型 | 该怎么改 | 落到哪个部件 |
| --- | --- | --- |
| 工具报错 TOOL ERROR | 先分清是输入错、超时、能力缺失、权限还是没读输出；给**一个有边界的备选方案和停止条件**，绝不规定盲目重试 | 常驻提示 / 工具说明 |
| 机械重复 MECHANICAL REPETITION | 重复的确定性抽取、转换、核对，写成有明确输入输出和失败行为的脚本 | C7 `scripts/<名>.py` |
| 触发式流程 TRIGGERED WORKFLOW | 窄而多步的流程做成按需技能，在常驻文字里写明触发条件，并带上它需要的脚本 | C6 技能 + 触发行 |
| 被无视的硬规矩 IGNORED INVARIANT | 只有**反复**证据表明清楚的文字被跳过，才上防御性杠杆；不能挡住正常完成 | C8 插件（Codex 为钩子） |
| 普通的先后顺序 ORDINARY SEQUENCING | 简洁的常驻指引；一次性的错误不写代码，也不要把专业判断自动化 | C1 / C2 常驻文字 |

INV 还有一条收尾要求：要定义什么叫“证据够了”，给每个交付物留出余量，并**重新打开或机械检查**交付物——“a successful write call does not establish usability”（写入成功不等于可用）。

### DOM：把行家知识变成可检查的规则

| 规则形式 | 要写清什么 |
| --- | --- |
| 分析动作 ANALYTIC MOVE | 点名操作——比较、核对、计算、分类、追溯、起草、解释——它的输入和要求的结果 |
| 交付物契约 ARTIFACT CONTRACT | 必备部分、部分之间的依赖，以及一致性和实用性的领域检查 |
| 决策规则 DECISION RULE | 触发条件、支持证据、要解决的冲突、必须明说的不确定性 |
| 编码形式 ENCODING | 形式和内容一样要斟酌：有明确触发场景的领域知识，默认放技能（用不到时不花钱，同领域下一个任务也能调用）；常驻记忆只放对**每个任务**都成立的短事实 |

**DOM 的两条硬规矩**① **绝不编造**权威、编号、标准或引文；要指向有权威的来源，断言需要证据。② 写代理能**执行并检查**的知识，而不是背景读物：“交付前确认 X 覆盖了 A、B、C 每一项”胜过一大段说明。

### “本镇才有的”与“到哪都用得上的”

提议提示词里有一段 GENERALIZE，专门讲这件事。它给了三个对照例子（原文照录）：

```tree
workspace fact   "attrition role 'HR' maps to position 'HR Manager'; 'Manager' has no
                  open requisition"                      -- verified here, labelled here
procedure        "reconcile role names explicitly before joining; list unmatched leftovers"
too generic      "be thorough"                           -- changes no behaviour
```

- **工作区事实**（本镇才有的）：基础执行花了代价才发现的、**经过验证**的事实最值钱，直接写事实本身，并用“在本工作区……”标注，让读者分得清事实和流程。猜出来的事实比没有更糟。
- **流程**（到哪都用得上的）：要按**整个领域**来写，因为这棵 harness 如果被选中，会存进该领域的经验库，成为后面每个任务的范例（第 5 站）。
- **太空泛**：“要仔细”——不改变任何行为。

📄 harness2/core/prompts.py · \_INV\_TEMPLATE（节选，中文注释为本教程所加）

```python
_INV_TEMPLATE = """\
# YOUR DIMENSION: INV -- how the agent WORKS

You own procedure, tool use and completion -- not subject matter. Trace the workflow, fix its
earliest observed divergence, and match each failure to the cheapest effective component:
...
Do not add professional rules, required domain sections or matter facts. A parallel candidate
owns them; stay focused on how the agent works."""
# ↑ 末尾这句就是“拿铜钥匙的不许翻历书”。DOM 模板的结尾对称地写着：
#   "Do not diagnose commands, retries, reading order, output paths, budgeting, scripts or hooks.
#    A parallel candidate owns procedure; stay on practitioner knowledge."
```

**教学解读：为什么要拆成两个维度？**如果让几个编辑器读同一份证据、各自“随便改”，它们很可能挤向同一个最显眼的修复，候选之间差别很小，试探就浪费了。强制分工后，INV 候选和 DOM 候选天然互补：合成提示词也说，当一个 INV 改动和一个 DOM 改动**各自站得住**时，**合并**就是预期结果。

> 🖐 动手演示「铜钥匙还是银钥匙？」：请打开网页版体验。

**小测：**DOM 编辑器从材料里读到“本案的申报截止日是 3 月 15 日”，想把这句写进 `LongTermMEMORY.md`。对吗？

- A. 对，长期记忆就是用来记东西的
- B. 不对：本案事实存成长期记忆会成为下个任务的错误锚点；若已被证据验证，可以标注“在本工作区……”写进相关组件
- C. 不对：DOM 编辑器不允许写任何事实
- D. 对，但应该写进 systemprompt.md

<details><summary>看答案</summary>

**答案：B**　DOM 提示词明说 “Never store this matter's facts as durable memory: they are wrong anchors for the next task.” 同时 GENERALIZE 又说验证过的工作区事实最有价值——两者不矛盾：事实可以写，但要标注清楚，而且不能当成跨任务都成立的长期记忆。

</details>

**本站带走三句话**

- INV 管流程、工具和收尾；DOM 管交付物、受众、来源和一致性。两者互不越界。
- INV 的核心是“失败类型 → 最便宜的有效部件”；DOM 的核心是“把行家知识写成可执行、可检查的规则”。
- 工作区事实要标注；流程按领域写；空话不写。
