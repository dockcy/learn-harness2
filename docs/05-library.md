# 第 5 站｜老船长的航海日志

对应源码：[core/library.py](https://github.com/google-research/harness2/blob/main/harness2/core/library.py)、[core/selection.py](https://github.com/google-research/harness2/blob/main/harness2/core/selection.py)、[core/schedule.py](https://github.com/google-research/harness2/blob/main/harness2/core/schedule.py)

**【寓言】**

### 老船长的航海日志

港口有位老船长，不再出海了，专管一本**航海日志**。年轻船长一个接一个出航，每趟都是没走过的航线。

日志按海域分本：北海一本，南海一本。“北海的经验拿到南海，只会害人。”

每位船长出航前，只能读**自己之前**那些航次的记录。有一回日志柜里多出几页“以后的航次”——那是上次演练留下的草稿——老船长二话不说先抽掉：“还没发生的事，不许当经验。”

一趟航行回来，港务长会从几条船里挑出货物最好的那条，但他挑的时候只验货，不看船是怎么改装的。所以老船长写日志时，从不只抄“哪条船被选中”。他把被选中那条船的**整套海图和装备单**原样收进来，不做摘要；再列一张表，**每条船的每处改装**一行：改了什么、航迹上看到了什么变化、结论是“有用”“有害”“没看出作用”还是“说不清”。

年轻人不服：“被选中的船，改装当然都有功。”老船长摇头：“港务长只验了货。被选中的船上，有的改装可能一点用没有；落选的船上，倒可能有一处真管用。看航迹，别看结果。”

有条船一口气改了帆、改了舵、换了罗盘，只跑了一趟，回来得快。老船长在结论栏写：**说不清**。“三样一起改，只跑一趟，谁知道是哪样起的作用？写‘说不清’不丢人，编一个因果出来，后面每个读日志的人都会被害。”

表的最后，他最多写**一条**经验，要写清四件事：遇到什么样的局面、该怎么改、凭的是表里哪几行、有几分把握。“要小心驾驶”这种话他不写——谁都知道，等于没说；“三月初七刮东北风四级”他也不写——这辈子不会再遇到一模一样的。他写的是：“航道有暗礁又起雾时，先降帆再测深。”

要是哪一趟实在总结不出站得住的经验，他就写“无可记”，**这一趟干脆不进日志**。

猜一猜：这本航海日志，以及老船长写日志的规矩，对应 Harness² 里的什么？为什么它让名字里多了一个“²”？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：反思 + 经验库 —— 第二层“改进级递归”

每个任务选定交付后，Harness² 再开一次**反思会话**（`reflect_adoption`），逐条评估每处改动，最多提炼一条可迁移的经验；然后把被采纳的**整棵 harness** 连同经验存进**按领域划分的经验库**（`Library`）。同领域后面的任务在提议时都能读到它。经验库就是项目所说的**改进 harness**（improvement harness）：它不给干活的代理用，而是给“改马具的人”用——改进过程本身也在被改进，这就是第二层递归。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 按海域分本 | 经验库按**领域**分目录（并且并行、串行各一份）：`library/<模式>/<领域>/` |
| 只能读之前航次的记录 | `lib.retain(task_ids[: i - 1])`：只保留当前任务之前的条目 |
| 整套海图原样收进，不做摘要 | 存整棵 harness 树：FULL component tree，不是总结 |
| 每处改装一行 | `<edits>`：component / candidates / change / observed / verdict |
| 有用 / 有害 / 没看出作用 / 说不清 | `helped` / `hurt` / `no observed effect` / `confounded` |
| 港务长只验货 | 盲选只比交付物，选中 ≠ 每条改动都有功 |
| 最多一条经验，写清四件事 | `<experience>`：cue / lesson / evidence / confidence |
| “无可记”就不进日志 | 回复 `NO_ENTRY`；`has_experience` 不成立时 `Library.add` 直接返回，不入库 |

### 反思会话的三条原则

**① 被采纳的候选不是唯一的证据**“Selection compared DELIVERABLES with the harnesses hidden, so the choice says which output read best -- not which edit worked. … Read the trajectories, not the verdict.”  
盲选只说明哪个产出读起来最好，不说明哪条改动起了作用。只出现在落选候选里的改动，可能才是真正改善行为的那一条。

**② 宁可写“说不清”，也不编因果**一个候选同时改了好几个组件、没有哪次执行能单独隔离其中一个，或者差异只靠**一次**执行撑着——都应该用 `confounded`，而且**优先**用它。原文：“A confounded row is a useful record; an invented attribution poisons the library for every later task.”

**③ 经验要“刚好”能迁移**`cue` 描述的是局面的**形状**，不是这个任务的事实；`lesson` 是对 harness 的一个可执行、可检查的操作，必须点名组件。太空泛没用（“be thorough”），太具体不会再触发（“the fee rose to 250 on Jan 1”）；刚好的例子：“当一份文书包含几个先后生效的行为、其中一个会终止行为人自己的权限时，把终止权限的那个放在最后”。只靠 `confounded` 行撑着的经验是猜测，要么收窄，要么放弃。

### 一条真实的经验库条目（来自本地 demo 运行）

下面是运行 `harness2-demo --k 2` 后，第一个任务 `ledger-1` 存进经验库的 `EXPERIENCE.md`（原文照录）。第二个任务 `ledger-2` 的每个编辑器，都会在 `context/library/` 里读到它：

```tree
# ledger-1

- adopted: `agg1`  (run `demo-oc-agg2/ledger-1/agg1`)
- components: 1 scripts; 62 always-on chars

## Why this was chosen
The signed total matches the source ledger.

## What each edit did
component: scripts/summarize.py
candidates: inv1
change: dropped the positive-only filter from the amount sum
observed: the probe total included the credits the base run omitted
verdict: helped

## Transferable lesson
- **cue**: When a ledger includes credits and debits
- **lesson**: Include both signs when summing in scripts/summarize.py.
- **evidence**: The scripts/summarize.py row -- removing the positive-only filter changed the probe total to include the credits omitted by the base trajectory.
- **confidence**: high for this observed arithmetic contrast
```

（中文大意：采纳了 agg1；唯一的改动是去掉了求和脚本里“只加正数”的过滤，试探执行的合计因此把基础执行漏掉的贷方算了进去，结论“有用”。经验：账目里同时有借贷时，`scripts/summarize.py` 求和要正负都算。）

📄 harness2/core/library.py（节选，中文注释为本教程所加）

```python
def has_experience(experience: dict | None) -> bool:
    # cue、lesson、evidence 三项都必须是非空字符串
    return isinstance(experience, dict) and all(
        isinstance(experience.get(key), str) and experience[key].strip()
        for key in ("cue", "lesson", "evidence")
    )

class Library:
    def retain(self, task_ids):
        """只保留当前任务之前的条目。"""
        keep = {slug(task_id) for task_id in task_ids}
        self.forget([entry for entry in self.entries() if entry not in keep])

    def add(self, task_id, harness, *, why="", label="", run_id="", experience=None):
        """存一棵被采纳的 harness 和采纳理由，然后从磁盘重建 INDEX.md。"""
        if not has_experience(experience):
            return None                      # 没有站得住的经验：整趟不入库
        context.assert_tree_has_no_grader_verdicts(harness)   # 入库前先过绊线（第 7 站）
        ...
```

调用处（`schedule.py`）还多一道门槛：只有选择**成功**（`sel.ok`，即不是回退代选的）且有经验时才入库。`retain` 的意义在断点续跑时尤其明显：磁盘上可能残留着上一次运行里“后面任务”的条目，必须先清掉，保证第 i 个任务看到的经验库永远只包含前 i−1 个任务。

> 🖐 动手演示「这条经验写得好吗？」：请打开网页版体验。

> 🖐 动手演示「给改动下结论」：请打开网页版体验。

**小测：**某任务的盲选因为选择器没写 ```` ```choice ```` 而回退到 `agg1`，反思也写出了一条完整的经验。这棵 harness 会进经验库吗？

- A. 会，只要有经验就入库
- B. 会，但只存经验不存 harness
- C. 不会：入库要求选择成功（sel.ok），回退代选不算
- D. 不会：回退时根本不做反思

<details><summary>看答案</summary>

**答案：C**　`schedule.py` 入库前检查 `sel.ok` 和 `has_experience` 两个条件。回退是“按规矩代选”，并没有经过真正的比较，不能当成值得后人参考的范例。

</details>

**本站带走三句话**

- 经验库 = 改进 harness：按领域存整棵被采纳的 harness + 一条有证据的经验，给后面的编辑器读。
- 反思要读轨迹、不读结论；多处同时改或只跑一次，就写 `confounded`。
- 没有站得住的经验就 `NO_ENTRY`，整趟不入库；后面的任务只看得到前面的条目。
