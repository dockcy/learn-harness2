# 第 4 站｜蒙眼品酒会

对应源码：[core/selection.py](https://github.com/google-research/harness2/blob/main/harness2/core/selection.py)、[core/prompts.py](https://github.com/google-research/harness2/blob/main/harness2/core/prompts.py)

**【寓言】**

### 蒙眼品酒会

葡萄园要选一桶酒送进王宫。三位酿酒师用同一批葡萄，各调出一桶。

管家主持品鉴，立了几条规矩。

第一，**只有三桶成品进品酒室**。没调过的原酒、调到一半的试样，一概不进——“今天比的是成品。”

第二，进门前先查桶：漏空了的、根本没装酒的，直接撤下，不占杯子。

第三，三只杯子只贴字母 A、B、C。哪个字母对应哪一桶，由管家抽签决定；签筒用年份、批次和酿法刻了一枚固定的封印，所以哪天要重新品一次，**同一桶酒还会落在同一个字母上**。品酒师不知道哪杯出自哪位大师，更不知道各自用了什么秘方。

第四，品酒师手里有王宫的点单信和葡萄的产地记录，每杯都是**满杯**，不是只给一小口。管家提醒他：“工序多、花样多的那桶，不加分。几杯尝起来差不多也正常，那就看真正要紧的那点差别。”

第五，品酒师必须写下选哪个字母、为什么。万一他当场说不出个所以然，按规矩送第一桶，并在账上注明“未经品鉴，按规矩代选”。

有一年只调出了一桶，管家干脆没请品酒师——一桶酒，没什么可选的。

还有一位王宫评酒官，他手里有真正的评分表。可他只在酒**已经装车送走之后**才来打分，而且从不把分数透露给酿酒师和品酒师。

有个学徒问管家：“直接告诉品酒师哪桶是大师调的，不是更省事吗？”管家摇头：“他一知道是谁调的、用了多复杂的方子，舌头就不是他自己的了。”

猜一猜：这场品酒会是 Harness² 的哪一步？“蒙眼”蒙住的到底是什么？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：盲选（Blind Selection）

提议—试探—合成产出 k 个**最终候选**后，Harness² 开一次独立的**选择会话**：选择器只看到任务说明、源材料和每个候选的**交付物**，候选用**打乱的字母**匿名。它看不到 harness、看不到是谁产生的、也看不到任何分数。“蒙眼”蒙住的是**产生过程**——只比结果。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 只有三桶成品进门 | `selection_pool`：只放 k 个最终候选（并行 `agg1..aggk`，串行 `c1..ck`），基础执行和中间候选不进池 |
| 漏空的桶先撤下 | `_render_pool`：没交付、交付物为空、渲染失败的候选先剔除，并记录原因 |
| A、B、C 抽签，封印固定 | `assign_ids`：用 `sha1("任务|k|模式")` 做种子打乱，重跑结果不变 |
| 不知道哪位大师、什么秘方 | harness 和来源都被隐藏，只比交付物 |
| 点单信、产地记录、满杯 | 选择器读 `task.md`、`source/`、每个候选完整未截断的 `candidates/<id>.md` |
| 工序多的不加分 | “no credit for a more elaborate one” |
| 写下字母和理由 | 回复里必须有 ```` ```choice ```` 代码块和理由 |
| 说不出来就按规矩送第一桶 | 选择失败时回退到第一个最终候选，并标记 `fallback=True` |
| 只有一桶就不请品酒师 | k=1 时走 `trivial_selection`，不开选择会话 |
| 评酒官装车后才打分 | 评分（judge）只在选择**提交之后**运行，方法本身从不读取分数（第 7 站） |

### 为什么要“蒙眼”？

选择器也是一个大模型。如果它看得到“这是改了 5 个组件、加了 3 个技能的版本”，就很容易偏向**看起来更用心**的那个。所以 Harness² 在设计上把过程信息全部拿掉：

- **匿名**：只有字母，没有 `agg2`、`c3` 这种暴露来源和轮次的标签。
- **打乱**：字母顺序和生成顺序无关，避免“最后一个最好”之类的位置偏见。
- **只比交付物**：harness、轨迹都不给看。
- **可复现**：种子由任务、k、模式决定，重跑同一配置，字母分配完全一样，方便审计和断点续跑。

📄 harness2/core/selection.py（节选，中文注释为本教程所加）

```python
def assign_ids(labels, *, task_id, k, mode) -> dict[str, str]:
    """匿名 id -> 标签：先按规范顺序排序，再用固定种子打乱——重跑结果稳定。"""
    seed = int(hashlib.sha1(f"{task_id}|{k}|{mode}".encode()).hexdigest()[:12], 16)
    ordered = sorted(labels)                 # 先排序：与传入顺序无关
    random.Random(seed).shuffle(ordered)     # 再用独立的随机数生成器打乱，不影响全局随机状态
    return {_anon_id(i): lbl for i, lbl in enumerate(ordered)}   # A, B, C, …, Z, AA, AB …

def selection_pool(mode, k, rollouts, base):
    """选择池只有一个出处：恰好是该模式的 k 个最终候选。"""
    del base          # 参数故意不用：传进来是为了在调用处“看得见”基础执行被排除了
    labels = ([f"agg{i}" for i in range(1, int(k) + 1)] if mode == "agg"
              else [f"c{t}" for t in range(1, int(k) + 1)])
    return {lbl: rollouts[lbl] for lbl in labels if lbl in rollouts}
```

注意 `del base` 这个小设计：参数明明不用，却要求调用方传进来。注释解释说，这样“排除基础执行”这件事在**构建池子的地方一眼就能看见**，不会被误以为是遗漏。

📄 harness2/core/prompts.py · POOL\_FINALS\_SELECT（原文）

```python
"# THE CANDIDATES ARE ANONYMOUS ON PURPOSE\n\n"
"The ids are arbitrary and shuffled, and tell you nothing about how an output was "
"produced. No candidate is privileged and there is no credit for a more elaborate one; "
"several may look nearly identical, and then you decide on the small differences that "
"actually matter."
# 中文：候选是故意匿名的。id 是任意的、打乱的，不透露产出方式。没有候选享有特权，
#      更复杂的那个也不加分；几个看起来几乎一样也正常，那就比真正要紧的细小差别。
```

> 🖐 动手演示「蒙眼品酒：真实的匿名分配」：请打开网页版体验。

### 选择失败怎么办？

**正常**回复里找到 ```` ```choice ````，且字母在池中 → 采用，记下理由

→

**失败**没写 choice / 选了不存在的字母 / 会话出错

→

**回退**池里有基础执行就选它；只有最终候选时选排序第一个（如 `agg1`）；标记 `fallback=True`

函数文档写得很清楚：“A selector failure falls back … and never raises; an adapter bug does raise, because it is a bug and not a selection outcome.”——选择器出错是“选择结果”的一种，要兜住；适配器出错是 bug，要大声报出来。

**小测：**关于盲选，下面哪一项是**错**的？

- A. 选择池只包含 k 个最终候选，基础执行不在池里
- B. 同一任务、同一 k、同一模式重跑，字母分配完全相同
- C. k=1 时不开选择会话，直接交付唯一的最终候选
- D. 选择器能看到每个候选的 harness，以便判断哪个改得更好

<details><summary>看答案</summary>

**答案：D**　D 是错的。选择器只看交付物，harness 被刻意隐藏。所以第 5 站的反思提示词会提醒：选择结果只说明“哪个产出读起来最好”，不说明“哪条改动起了作用”。

</details>

**本站带走三句话**

- 盲选只比交付物：匿名、打乱、可复现，过程信息全部隐藏。
- 池子只放 k 个最终候选；空交付先剔除；选择失败有确定的回退，并留下标记。
- 评分只在选择提交之后，方法的任何决策都碰不到分数。
