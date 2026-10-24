# 终点站｜亲手跑一遍，再回头看全景

对应源码：[demo.py](https://github.com/google-research/harness2/blob/main/harness2/demo.py)、[cli/demo.py](https://github.com/google-research/harness2/blob/main/harness2/cli/demo.py)

十二则寓言讲完了。最后一站不讲故事：用项目自带的**本地演示**，把前面所有设计在你自己的电脑上“跑出来”，再用一张术语表和一组总测验收尾。

### 一、安装并运行本地演示（无需任何模型密钥）

官方要求 **Linux + Python 3.12 + [uv](https://docs.astral.sh/uv/)**。在 harness2 仓库根目录执行：

📄 终端

```bash
git clone https://github.com/google-research/harness2.git && cd harness2
uv venv --python 3.12 .venv          # 建虚拟环境
source .venv/bin/activate
uv pip install -e '.[render]'        # 以可编辑方式安装
harness2-demo --output runs/demo --k 2   # 两种递归模式都跑一遍，k=2
```

正常结束会打印一行 Local demo: 2 tasks completed; 0 failed. …/runs/demo/demo.json。本地演示用**确定性的“假编辑器”**代替大模型（`DemoProposer`），但递归流程、经验库、盲选、账本校验、马具校验**全部是真代码**，每次 rollout 也是真的用 Python 执行脚本。

### 二、演示在做什么：一道“只加正数”的错题

任务书只有一句：“Sum every signed amount in ledger.csv. Return Total: with two decimal places.”（把 ledger.csv 里所有带符号的金额加起来，保留两位小数。）可基础马具自带的脚本有个 bug——**只加正数**：

📄 harness2/demo.py · BASE\_SCRIPT（基础马具里的 scripts/summarize.py）

```python
with open(sys.argv[1]) as source:
    amounts = [Decimal(row['amount']) for row in csv.DictReader(source)]
total = sum((amount for amount in amounts if amount > 0), Decimal(0))   # ← bug：漏掉了负数（贷项）
print(f'Total: {total:.2f}')
```

| 任务 | ledger.csv 里的金额 | 正确答案 | 基础马具算出 |
| --- | --- | --- | --- |
| `ledger-1` | 100.25、−20.10、5.00 | **85.15** | 105.25 × |
| `ledger-2` | 35.50、−10.25、−5.00 | **20.25** | 35.50 × |

假编辑器 `DemoProposer` 按会话标签扮演三种角色——对照前面各站，看看每个角色对应哪个设计：

| 会话标签 | 它做什么 | 对应哪一站 |
| --- | --- | --- |
| `inv1`、`dom1`、`agg1`、`c1`…… | 在副本 `context/harness/` 里把 `" if amount > 0"` 删掉，并留一句笔记 “Keep signed amounts: the base total omitted credits in the source ledger.” | 第 2、3、6 站：提议 / 合成；第 8 站：改完要过 `validate_tree`（演示要求必须保留 `scripts/summarize.py`） |
| `select.*` | 自己从 `source/ledger.csv` 算出正确总数，在匿名候选里挑出含 `Total: 85.15` 的那个 | 第 4 站：盲选，只看到字母，不知道谁是谁 |
| `experience.*` | 比较选中马具和基础马具：脚本确实改了，就写 `verdict: helped` 和一条经验（cue：账本里同时有借贷项时……） | 第 5 站：反思 + 经验库 |

演示的 `BenchSpec` 还声明了 `leak_globs=("reference_answer.txt",)`（第 7 站的防泄漏模式），`BenchPrompts` 也同样经过了第 7 站的禁词检查——即使是演示，规矩也一条不少。

**demo.json 里的两个数字，自己算一遍**`execution_count: 28`：每个任务，并行模式 2 个基础 rollout + 4 个候选（inv1/dom1/inv2/dom2）+ 2 个合成（agg1/agg2）= 8 次；串行模式与之**共用**那 2 个基础 rollout，再加 4 个候选 + 2 个合成（c1/c2）= 6 次。每任务 14 次 × 2 个任务 = 28。  
`editor_calls: 32`：每任务每模式 4 次提议 + 2 次合成 + 1 次盲选 + 1 次反思 = 8 次，× 2 模式 × 2 任务 = 32。  
对照第 6 站：每种模式各自的账本都正好是 **R = 4k = 8**、**P = 3k = 6**（盲选与反思不计入 P）。

### 三、跑完之后，目录里有什么

```tree
runs/demo/
├── base/                         # 基础马具（第 1 站的八个组件里用到的那几个）
├── sources/ledger-1/ledger.csv   # 任务输入
├── executions/                   # 每次 rollout 的产物，路径 = run_id（第 12 站）
│   ├── demo-oc-agg2/ledger-1/base1/   answer.txt · trajectory.md   # 基础 rollout，两种模式共用
│   ├── demo-oc-agg2/ledger-1/inv1/    …dom1 · inv2 · dom2 · agg1 · agg2
│   └── demo-oc-seq2/ledger-1/inv1/    …dom1 · inv2 · dom2 · c1 · c2
├── runs/demo-oc-agg2/ledger-1/
│   ├── context/inv1/             # 编辑器看到的证据目录：task.md · harness/ · rollouts/ · deliverables/ · source/（第 9 站）
│   ├── context/agg1/             # 合成器多了 pool/（候选池）和 decisions/
│   ├── harnesses/agg1/           # 每个候选马具的完整文件树
│   ├── selection/  reflection/   # 盲选记录、反思记录（第 4、5 站）
│   └── summary.json              # 任务汇总；重跑同一条命令时据此续跑（第 12 站）
├── library/k2/agg/accounting/
│   ├── INDEX.md                  # 经验库索引
│   └── harnesses/ledger-1/EXPERIENCE.md + harness/   # 被采纳的马具 + 可迁移的经验（第 5 站）
└── demo.json                     # 总结：完成数、执行次数、编辑器调用次数
```

建议打开 `library/k2/agg/accounting/harnesses/ledger-1/EXPERIENCE.md` 看看：它记录了被采纳的是 `agg1`、为什么选它（“The signed total matches the source ledger.”）、每处改动的结论（`verdict: helped`）和一条可迁移经验。`demo.json` 里 `ledger-2` 的 `library_entries_before` 是 1——第二个任务开始前，经验库里已经有了第一个任务留下的那一条。

### 四、跑一个真实基准（会产生模型费用）

真实基准还需要 Node.js 20+、Google Cloud CLI 以及各基准自己的依赖（LAB 需要 Pandoc 和 Poppler，WorkBuddy-Bench 需要 Docker），并在 `.env` 里配置 Vertex AI 项目和模型。官方示例：

📄 终端（命令来自 harness2 README，中文注释为本教程所加）

```bash
cp .env.example .env                 # 填写模型配置
gcloud auth application-default login

harness2-setup lab                   # 安装 LAB（法律工作）基准
harness2-check --bench lab           # 体检：依赖、凭据、数据是否齐全
harness2 --bench lab --k 1 --mode parallel \
  --only-domains antitrust-competition --max-tasks 1   # 只跑 1 个任务，先试水
harness2-judge --bench lab --k 1 --mode parallel       # 评审（只有这一步会用到评分标准，第 7 站）
harness2-report --bench lab --k 1 --mode parallel      # 出报表

# 常用变体
harness2 --bench lab --k 2 --mode sequential ...       # 串行递归（第 6 站）
harness2 --bench lab --k 1 --mode parallel --dry-run   # 只预览会选中哪些任务，不调用模型（第 11 站）
harness2 --bench lab --k 1 --mode parallel --substrate cx   # 换成 Codex 执行器（第 10 站）
```

三个基准：`jb`（JobBench，职业工作）、`lab`（LAB，法律工作）、`wb`（WorkBuddy-Bench，办公 / 网页 / 代码，后续命令都要带 `--subset office|web|code`）。评审和报表必须用和精修运行**相同**的基准、执行器、子集、`--k`、`--mode` 与种子。中断了就**重跑同一条命令**；换模型或换任务选择时，用一个新的 `HARNESS2_RUNS_DIR`。

**务必先限制网络**官方 README 特别提醒：执行器的网络访问不受限制，Codex 运行时还关闭了沙箱，而公开基准的评分细则可能在网上找得到。正式评测前，请按官方 [docs/EXPERIMENTS.md#web-access](https://github.com/google-research/harness2/blob/main/docs/EXPERIMENTS.md#web-access) 配置网络限制，防止执行器查到答案或评分标准——这是第 7 站“无答案原则”在运行环境上的延伸。

### 五、读源码的推荐顺序

| 顺序 | 文件 | 读它的时候，回想哪一站 |
| --- | --- | --- |
| 1 | `harness2/demo.py`、`cli/demo.py` | 终点站：最小的完整适配器，100 多行 |
| 2 | `core/recursion.py`（`_run_stage`、`run_parallel`、`run_sequential`） | 第 2、3、6、12 站 |
| 3 | `core/selection.py`、`core/library.py` | 第 4、5 站 |
| 4 | `core/schedule.py`（`run_task`、`run_domain`） | 第 5、12 站：任务流、经验传承、续跑 |
| 5 | `core/prompts.py`、`core/context.py` | 第 7、9 站：任务书和证据目录怎么拼 |
| 6 | `core/tree.py`、`core/ledger.py` | 第 6、8 站：校验与账本 |
| 7 | `core/spec.py`、`substrate/base.py`、`benchmarks/lab.py` | 第 10、11 站：三根轴和冻结配置 |

### 六、中英术语对照表

| 英文 | 本教程译法 | 一句话解释 | 所在站 |
| --- | --- | --- | --- |
| harness | 马具 | 包在模型外面的一切：提示词、护栏、技能、脚本、插件…… | 1 |
| base harness | 基础马具 | 任务开始时继承来的那套马具 | 1 |
| always-on | 常驻文本 | 每轮对话都会加载的组件，受字数上限约束 | 1、8 |
| rollout | rollout（一次完整执行） | 带着某套马具把任务完整做一遍 | 2 |
| trajectory | 轨迹 | 一次执行里的动作与观察记录 | 2、9 |
| deliverable | 交付物 | 执行产出的结果文件 | 2、10 |
| Propose–Probe–Compose | 提议—试探—合成 | 任务级递归的一步 | 2 |
| INV / DOM | 通用做法 / 领域知识 | 两个互补的提议维度 | 3 |
| blind selection | 盲选 | 候选匿名为字母、打乱顺序后再挑 | 4 |
| library / experience / lesson | 经验库 / 经验 / 教训 | 跨任务传承的马具与可迁移经验 | 5 |
| cue · verdict · confounded | 触发线索 · 结论 · 混杂 | 经验条目与改动结论里的字段 / 取值 | 5 |
| parallel (agg) / sequential (seq) | 并行递归 / 串行递归 | “宽”与“深”两种扩展方式 | 6 |
| ledger · R / P | 账本 · rollout 数 / 会话数 | 每种模式必须正好 R=4k、P=3k | 6 |
| answer-free · leak\_globs | 无答案原则 · 泄漏模式 | 编辑器永远看不到答案和评分标准 | 7 |
| validate · autotrigger | 校验 · 自动触发 | 改完的马具必须过契约检查，不过就带着错误重试 | 8 |
| context dir / mission | 证据目录 / 任务书 | 证据写成文件，任务书只说做什么 | 9 |
| substrate · adapter · surface | 执行器（基底）· 适配器 · 可编辑面 | 三根互相独立的轴 | 10 |
| frozen dataclass | 冻结数据类 | 创建即校验、之后不可修改的配置值 | 11 |
| run\_id · namespace · fingerprint · resume | 运行编号 · 命名空间 · 指纹 · 续跑 | 让结果可复用、可续跑、不串味 | 12 |

### 七、总测验

**小测：**1. Harness² 改进智能体的方式是？

- A. 用执行轨迹微调模型权重
- B. 不动模型，只编辑模型外面的马具，并把经验带到后续任务
- C. 让多个模型投票
- D. 把评分标准写进系统提示

<details><summary>看答案</summary>

**答案：B**　“不换马，换马具”，而且是两级递归：任务内（提议—试探—合成）+ 跨任务（经验库）。D 恰恰是第 7 站严格禁止的。

</details>

**小测：**2. 在本地演示里，盲选为什么能选中正确的候选？

- A. 它知道 agg1 是合成器做的，优先选它
- B. 它读取了 reference\_answer.txt
- C. 它总是选字母 A
- D. 它只根据任务输入和各候选的交付物自己判断哪个结果对

<details><summary>看答案</summary>

**答案：D**　选择器看到的只有匿名字母、交付物和任务输入（`source/`）；它不知道哪个字母是哪个标签，也碰不到答案文件。

</details>

**小测：**3. k=2 的并行模式里，下面哪一组标签恰好构成账本里的全部 rollout？

- A. base1 base2 inv1 dom1 inv2 dom2 agg1 agg2
- B. inv1 dom1 inv2 dom2
- C. base1 base2 c1 c2
- D. base1 inv1 dom1 agg1

<details><summary>看答案</summary>

**答案：A**　R = 4k = 8：k 个基础 + 2k 个候选 + k 个合成。顺序也固定如此（第 12 站）。

</details>

**小测：**4. 编辑器交回的马具里新增了一个 `notes.txt`，会怎样？

- A. 被悄悄忽略
- B. 直接进入 rollout
- C. 校验失败，错误信息被写回任务书，让编辑器重试；仍不过就退回原马具
- D. 整个运行崩溃

<details><summary>看答案</summary>

**答案：C**　这是第 8 站的“校验—回灌—重试”：不在可编辑面里的路径不被接受，失败也不会让流水线崩溃。

</details>

**小测：**5. 想给 Harness² 接一个新的基准，最少需要做什么？

- A. 修改 core/recursion.py，加一个 if 分支
- B. 写一个满足 BenchmarkAdapter 协议的类（不必继承任何基类），并给它一份 BenchSpec
- C. 必须同时写一个新的执行器
- D. 把基准的评分脚本交给编辑器

<details><summary>看答案</summary>

**答案：B**　三轴解耦 + 结构化类型（第 10 站）：核心代码不认识任何具体基准；本地演示的 `DemoAdapter` 就是最好的范本。

</details>

**最后，把全景图再看一遍**回到[序章](#overview)的架构图，从红色主干开始，试着不看文字，把每个方框用一句话讲出来：**马具是什么（1）→ 一步递归怎么走（2）→ 往哪两个方向提议（3）→ 怎么公平地挑（4）→ 挑完怎么传承（5）**；然后是让它“可信”的约束（6 预算、7 无答案、8 校验、9 证据边界），以及让它“能跑很久”的地基（10 解耦、11 冻结配置、12 并发与续跑）。能讲出来，这个项目你就真的懂了。
