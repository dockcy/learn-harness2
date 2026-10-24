# 第 12 站｜同时出发的信使

对应源码：[core/recursion.py](https://github.com/google-research/harness2/blob/main/harness2/core/recursion.py)、[core/runmark.py](https://github.com/google-research/harness2/blob/main/harness2/core/runmark.py)、[core/proposer.py](https://github.com/google-research/harness2/blob/main/harness2/core/proposer.py)、[core/schedule.py](https://github.com/google-research/harness2/blob/main/harness2/core/schedule.py)

**【寓言】**

### 同时出发的信使

一家老字号商行，每天要往四个镇子送货单。早年只有一个信使，一趟送完再送下一趟，账房先生就照着回来的先后，一笔笔记进总账。

生意大了，掌柜添了马：**驿站只有两匹快马，所以最多同时派两个信使**。新问题马上来了——信使谁先回来全看路况，今天东镇的先回，明天北镇的先回。账房如果照“回来的先后”记账，同样的四单生意，每天记出来的顺序都不一样，月底对账的人头都大了。

老账房想了个办法：“回来一个，我先把回执收进抽屉，不动账本。等今天的信使全部回齐，再**照着派单簿上的顺序**一笔笔誊进去。这样不管派一个还是派两个，账本读起来一模一样。”

后来又出过两回事。一回是暴雨，四个信使只回来两个，第二天掌柜又让把四单全部重送一遍，白白多花了两份脚钱。另一回，有个信使在货栈门口看到一箱货，以为就是自己的，空手回来报“送到了”——其实那是上个月**另一个版本的货单**剩下的。

老账房于是立了三条规矩：

第一，**“货在仓里，不算送到。”**只有信使亲手交回、盖了火漆的回执才算数；回执上还要印着**这一版货单的指纹**。货单哪怕改了一个字，旧回执就作废。

第二，写回执先写在草稿纸上，写完了**一把换进回执匣**。谁也不会在匣子里看到一张写了一半的回执。

第三，“断了就照原样再派一次。”第二天把同一张派单簿再执行一遍：有合格回执的那几单直接跳过，没回执的、或者回执指纹对不上的，才重新派人。

还有一个小细节：每个信使出门前，都拿到一份**货单的誊抄本**，原件锁在柜里，谁也带不走、改不着。每一单还有个独一无二的编号，写明“哪个商号、哪个分号、第几批、哪一单”——“分号的名字不能空着，空着的话，东西两个分号的回执就要混在一起了。”

猜一猜：“同时派人但照派单簿记账”“盖指纹的回执”“断了照原样再派一次”，合起来是哪一类工程设计？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：并发但结果有序 + 幂等的断点续跑

Harness² 的各个阶段用 `ThreadPoolExecutor` 并发执行（宽度 `PHASE_WIDTH = 2`），但**账本永远在线程池收尾之后、按调用方给定的顺序写入**，所以并发运行和串行运行记下的标签序列完全相同。每次 rollout 成功返回后写一个 `.adapt_complete` 完成标记（原子写入、带马具指纹）；重跑同一条命令时，只有“标记有效且指纹一致”的结果才会被复用——这让整条流水线**可以随时中断、原样重跑**。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 驿站只有两匹快马 | `PHASE_WIDTH = 2`、`PROPOSER_CONCURRENCY = 2`（`config.py`）；后者是一个 `threading.BoundedSemaphore` |
| 回执先收进抽屉，不动账本 | 线程里调用 `_roll(..., record=False)`，不写账本 |
| 回齐了再照派单簿顺序誊写 | 线程池退出后 `for (label, _), rv in zip(items, got): ledger.rollout(label)`；提议阶段用 `_record_sessions` |
| 信使失败可以再跑一趟 | `TRANSPORT_ATTEMPTS = 2`：每次会话最多尝试 2 次 |
| “货在仓里，不算送到” | “presence of output is not enough”：只认 `mark_complete` 写下的标记 |
| 回执上印着货单指纹 | 标记里的 `harness` 字段 = 马具目录的 SHA-1 前 16 位；`is_complete` 要求指纹一致 |
| 草稿纸写完一把换进匣子 | 先写 `.adapt_complete.<pid>.tmp`，再 `os.replace`（原子替换） |
| 断了照原样再派一次 | 重跑同一条命令：读 `summary.json` 续跑，已完成的 rollout 直接复用 |
| 信使拿誊抄本，原件锁在柜里 | 每次提议会话在 `tempfile.mkdtemp(prefix="harness2-prop-")` 的副本里进行 |
| 每单独一无二的编号，分号名不能空 | `run_id = "<基准>-<基底>-<模式><k>[-s种子][-标签]/<任务>/<标签>"`；基底名为空直接报错 |

### 一、并发但有序：先跑完，再记账

**派单簿**items = [inv1, dom1, inv2, dom2]

→

**线程池并发**最多 2 个同时跑，`record=False`

→

**pool.map 收齐**结果按**输入顺序**返回

→

**按顺序记账**ledger.rollout(inv1, dom1, inv2, dom2)

📄 harness2/core/recursion.py · \_roll\_many（节选，中文注释为本教程所加）

```python
def _roll_many(adapter, ledger, task_id, items, run_id_of, work_dir, *, width) -> dict[str, RunView]:
    """Roll independent harnesses concurrently, then record them in the caller's order.

    The ledger is written after the pool drains, so a concurrent run records the same sequence
    of labels as a serial one.
    """
    # 中文：并发执行互不依赖的马具，再按调用方给的顺序记账。
    #       账本在线程池清空之后才写，所以并发运行和串行运行记下的标签序列一模一样。
    out: dict[str, RunView] = {}
    if not items:
        return out
    n = max(1, min(len(items), width))
    if n == 1:                                   # 宽度为 1：就是普通串行，边跑边记
        for label, tree in items:
            out[label] = _roll(adapter, ledger, task_id, label, tree, run_id_of, work_dir, record=True)
        return out
    with ThreadPoolExecutor(max_workers=n) as pool:
        got = list(
            pool.map(                            # ① map 的结果顺序 = 输入顺序，与谁先跑完无关
                lambda it: _roll(adapter, ledger, task_id, it[0], it[1], run_id_of, work_dir,
                                 record=False),  # ② 线程里不碰账本
                items,
            )
        )
    for (label, _tree), rv in zip(items, got):   # ③ with 块结束 = 所有线程已收工
        ledger.rollout(label)                    # ④ 再按派单顺序一笔笔记
        out[label] = rv
    return out
```

为什么不直接在线程里 `ledger.rollout()`？在 CPython 里 `list.append` 本身不会把列表写坏，但**顺序**取决于谁先跑完，每次都可能不同。账本的顺序会进入 `summary.json` 和报表，第 6 站的 `assert_identity` 也要逐条核对它。让顺序“确定”，同一份配置跑两遍才能逐字节比较。另外，`_roll` 自己把异常转成一条 `ok=False` 的记录（“A dead rollout is recorded, never raised.”），所以一个线程出错不会让 `pool.map` 半路抛异常、把其他结果丢掉。

> 🖐 动手演示「信使与账本」：请打开网页版体验。

### Python 语法小课：`ThreadPoolExecutor` 的两种收结果方式

📄 示例（本教程原创，已在 Python 3.13 上运行验证）

```python
import random, time
from concurrent.futures import ThreadPoolExecutor, as_completed

def 送信(镇子):
    time.sleep(random.random() / 10)     # 路况随机
    return 镇子

派单簿 = ["东镇", "西镇", "南镇", "北镇"]
with ThreadPoolExecutor(max_workers=2) as pool:
    print(list(pool.map(送信, 派单簿)))  # 永远是 ['东镇', '西镇', '南镇', '北镇']

with ThreadPoolExecutor(max_workers=2) as pool:
    futs = [pool.submit(送信, z) for z in 派单簿]
    print([f.result() for f in as_completed(futs)])  # 谁先完成谁在前：每次可能不同
```

`pool.map` 按输入顺序交还结果，适合“结果要按固定顺序处理”；`as_completed` 按完成顺序交还，适合“先完成的先处理”。Harness² 在需要确定顺序的地方（rollout、提议会话）用前者；评审器 `judge.py` 给一批选中结果打分时用后者——每条分数记录自带任务名、模式和标签，谁先出来都不影响后续统计。

### 二、完成标记：货在仓里，不算送到

📄 harness2/core/runmark.py（节选，中文注释为本教程所加）

```python
"""Trial identity: was this rollout finished, and by this configuration?

Completion is recorded explicitly by the code that observed the run return; presence of output
is not enough. The marker also fingerprints the harness that produced the rollout, so a rollout
from a different configuration is never reused.
"""
# 中文：这次 rollout 跑完了吗？是用“这份配置”跑完的吗？
#       完成与否，由亲眼看到运行正常返回的那段代码明确记下；目录里“有输出”不算数。
#       标记还记录产生它的马具指纹，所以换了配置跑出来的结果永远不会被误用。
MARK = ".adapt_complete"

def fingerprint(harness_dir):
    if harness_dir is None:
        return "base"                    # 原始马具：统一记为 "base"
    ...                                  # 按路径排序，逐个文件把“相对路径 + 内容”喂进 sha1
    return h.hexdigest()[:16]            # （__pycache__、.pyc、.DS_Store 不参与）

def mark_complete(where, *, run_id, harness_dir=None, extra=None):
    """Record that `run_id` finished. Call only after the runner returned normally."""
    payload = {"version": VERSION, "run_id": run_id, "at": time.time(),
               "harness": fingerprint(harness_dir), **(extra or {})}
    tmp = d / f"{MARK}.{os.getpid()}.tmp"
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True))   # ① 先写草稿
    os.replace(tmp, d / MARK)                                       # ② 原子替换：要么旧的，要么完整的新的

def is_complete(where, *, harness_dir=None, match_harness=True) -> bool:
    m = read_mark(where)
    if not m or m.get("version") != VERSION:
        return False
    if not match_harness:
        return True
    return m.get("harness") == fingerprint(harness_dir)            # ③ 指纹必须一致
```

适配器在 `execute()` 开头调用它（以 LAB 基准为例）：

📄 harness2/benchmarks/lab.py · execute（节选）

```python
out = self._run_dir(run_id)
if RM.is_complete(out, harness_dir=harness_dir) and self.artifacts_intact(out):
    return out                                   # 有效回执 + 产物完好：直接复用，不花一分钱
if out.is_dir() and any(out.iterdir()):
    reason = RM.why_not(out, harness_dir=harness_dir)
    print(f"  [lab-{self.substrate.name}] re-rolling {run_id}: {reason}")
    self._safe_rmtree(out)                       # 有残骸但不可信：清掉重跑
...                                              # 真正执行
if not (out / "metrics.json").is_file():
    raise RuntimeError("LAB rollout did not produce metrics.json: ... so this failure must not be cached")
RM.mark_complete(out, run_id=run_id, harness_dir=harness_dir,
                 extra={"output_fingerprint": self._output_fingerprint(out)})
```

**why\_not 会说的三种话**no .adapt\_complete -- never finished, or finished before completion was recorded（从没跑完）  
marker version 0 != 1（标记格式过期）  
harness fingerprint 3f2a… != 9c41… -- produced by a different configuration（换过配置）

### 三、名字即身份：run\_id 与 Namespace

📄 harness2/core/schedule.py · ns / Namespace（节选）

```python
def ns(benchmark, substrate, mode, k, *, seed=None, tag="") -> str:
    if mode not in MODES:
        raise ValueError(f"unknown mode {mode!r}; the method has exactly two: {MODES}")
    if not substrate:
        raise ValueError("namespace needs a substrate name ('oc' | 'cx'); an empty one would "
                         "let the two substrates' caches collide on every label")
        # 中文：基底名不能为空，否则两个基底的缓存会在每个标签上撞车
    out = f"{benchmark}-{substrate}-{mode}{int(k)}"     # 例：lab-oc-agg2
    if seed is not None: out += f"-s{int(seed)}"        # 例：lab-oc-agg2-s7
    if tag:              out += f"-{tag}"
    return out

@dataclass(frozen=True)                                 # 第 11 站：名字也是冻结的值
class Namespace:
    benchmark: str; substrate: str; mode: str; k: int; seed: int | None = None; tag: str = ""
    def run_id(self, task_id, label):
        return f"{self}/{task_id}/{label}"              # 例：demo-oc-agg2/ledger-1/inv1
```

因为每个 rollout 的名字精确到“基准-基底-模式-k-种子-标签/任务/候选”，缓存和完成标记都挂在这个名字下面，不同实验之间不会互相“捡到”对方的结果。注意基础 rollout（`base1…basek`）用的是一个共享的命名空间：两种模式**共用同一批基础执行**，既省钱，又保证两种模式从同一份证据出发、对比公平。

### 四、提议会话：誊抄本 + 内容寻址缓存

📄 harness2/core/proposer.py · Proposer.call（节选）

```python
cache_key = _call_fingerprint(label, mission, system, context_dir)  # 标签+任务书+系统提示+证据内容+证据路径
cached = self._cached(label, cache_key, require_workspace=bool(harvest))
if cached is not None:
    return cached                                  # 一模一样的请求：直接复用，不再花钱
for attempt in range(1, tries + 1):                # tries 默认 = TRANSPORT_ATTEMPTS = 2
    tmp = Path(tempfile.mkdtemp(prefix="harness2-prop-"))
    shutil.copytree(context_dir, tmp / "context", dirs_exist_ok=True)   # 誊抄本：编辑器只碰副本
    with _SEM:                                     # BoundedSemaphore(2)：同时最多 2 个会话
        text, cost, err = self._opencode(tmp, mission, system, wall)
```

`_call_fingerprint` 的文档字符串特别提到：“The resolved path is part of the key: the two modes can have byte-identical k=1 evidence and must still be independent draws.”——k=1 时两种模式的证据可能逐字节相同，但它们必须是**两次独立的抽样**，所以证据目录的绝对路径也算进缓存键里，避免一个模式“蹭”另一个模式的结果。

### 五、断点续跑：重跑同一条命令即可

**summary.json 已有且覆盖所需模式？**是 → 直接读结果（`_resume`）

→

**否则重新执行任务**但每个 rollout 先查完成标记

→

**提议会话查内容缓存**同样的请求不重复付费

→

**写 summary.json**flock 加锁 + 先写 .tmp 再 os.replace

经验库还有一个专门为续跑准备的动作：在任务流里处理第 i 个任务前，先 `lib.retain(task_ids[: i - 1])`——只保留**排在它前面**的任务产生的经验。这样即使中断后重跑，第 i 个任务看到的经验库也和一口气跑下来时完全一样，不会“提前看到”后面任务的经验（第 5 站的“只按时间顺序传承”在续跑时依然成立）。

**设计要点：确定性是“可续跑、可复现”的前提**研究代码最怕两件事：中途崩了只能从头来；同一份配置跑两次结果对不上，说不清是方法的波动还是代码的波动。Harness² 的做法是：**并发只用来省时间，不允许改变任何可观察的顺序**；**复用只认明确的完成标记 + 指纹**；所有写入都“先写临时文件再原子替换”。于是“中断后重跑同一条命令”就成了一个安全、便宜、可重复的操作——这正是工程上说的**幂等**。

**小测：**一次运行中途被 Ctrl+C 打断。之后你修改了 `inv2` 候选马具里的一个技能文件，再执行同一条命令。下面哪个说法正确？

- A. 因为 `inv2` 的运行目录里已经有输出文件，它会被直接复用
- B. 所有 rollout 都会从头重跑，之前的结果全部作废
- C. 标记有效且指纹一致的 rollout 被复用；`inv2` 指纹对不上，被清理后重跑
- D. 账本会按这次各 rollout 完成的先后顺序重新排列

<details><summary>看答案</summary>

**答案：C**　A 错在“有输出不算数”；B 错在完成标记正是为了避免全部重跑；D 错在账本永远按调用方顺序记录。

</details>

**小测：**把 `_roll_many` 里的 `pool.map` 换成 `as_completed`，并且在线程里直接 `ledger.rollout(label)`，最直接的后果是什么？

- A. 程序会死锁
- B. 账本里的标签顺序随“谁先跑完”而变化，同一配置两次运行的记录不再一致
- C. R 和 P 的数量会变多
- D. 没有任何影响

<details><summary>看答案</summary>

**答案：B**　数量不变（每个标签仍记一次），但顺序变得不确定。Harness² 明确要求“并发运行记下的标签序列和串行运行相同”。

</details>

**本站带走三句话**

- 并发只为省时间：线程里不写共享记录，收齐后按固定顺序写。
- “有输出”不等于“完成了”：只认原子写入、带指纹的完成标记。
- 名字即身份、写入要原子、续跑就重跑同一条命令——这就是幂等。
