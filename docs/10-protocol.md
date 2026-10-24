# 第 10 站｜打更人的招募告示

对应源码：[core/spec.py](https://github.com/google-research/harness2/blob/main/harness2/core/spec.py)、[substrate/base.py](https://github.com/google-research/harness2/blob/main/harness2/substrate/base.py)、[demo.py](https://github.com/google-research/harness2/blob/main/harness2/demo.py)

**【寓言】**

### 打更人的招募告示

镇子越扩越大，要招打更人。头几年，镇公所只招“更夫世家”的子弟，结果人总是不够。

新来的里正换了一张告示，上面不写出身，只写**要会做的几件事**：会敲梆子；认得自己片区的每条街；按时辰报更；见火就喊人；天亮交一张巡更单。末尾一句：“这几件都做得到，不问你是庄稼汉、退伍兵还是庙里的和尚。”

告示一贴，来的人五花八门。门口的书吏只核对一件事：**梆子、灯笼、巡更单带没带**。至于梆子敲得准不准、街认得全不全，书吏看不出来，得等第一晚上岗才见分晓。

后来镇子又并进来一个新街区，里正没改规矩，只是给新街区也贴了一张同样的告示。再后来，铜梆子换成了竹梆子，巡更的规矩也一字没改。

里正跟人算过账：“巡更的规矩、用什么梆子、巡哪个街区，是三件互不相干的事。哪件变了，只动那一件。”

猜一猜：这张“只问会不会、不问出身”的告示，在 Python 里叫什么？“三件互不相干的事”又分别对应 Harness² 的什么？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：typing.Protocol（结构化类型）+ 三轴解耦

Harness² 用 Python 的 `typing.Protocol` 定义接缝：只规定“要有哪些属性和方法”，**不要求继承**任何基类——结构对得上就算。借此把三件事彻底拆开：**方法**（core/，巡更规矩）、**执行器**（substrate/，梆子）、**基准**（benchmarks/，街区）。项目的说法是：“Implement these and the whole method works. Nothing here is method logic.”

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 告示上“要会做的几件事” | `BenchmarkAdapter(Protocol)` 列出的属性和方法 |
| 不问出身 | 结构化类型：不需要 `class X(BenchmarkAdapter)` 继承 |
| 书吏只核对带没带梆子 | `@runtime_checkable`：`isinstance()` 只检查成员是否**存在**，不检查签名和行为 |
| 新街区贴同样的告示 | 新基准 = 新写一个适配器，方法代码不动 |
| 铜梆子换竹梆子 | OpenCode ↔ Codex：换执行器，方法代码不动 |
| 巡更规矩 / 梆子 / 街区 | 方法 core/ ／ 执行器 substrate/ ／ 基准 benchmarks/ |

### Python 语法小课：Protocol 是什么

先看一个用中文标识符写的小例子（Python 3 允许中文变量名和类名）：

📄 示例（本教程原创，可直接运行）

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class 会打更(Protocol):              # 告示：只写“要会做什么”
    def 敲梆子(self) -> None: ...
    def 报时辰(self, 时辰: str) -> str: ...

class 退伍兵:                         # 没有继承任何东西
    def 敲梆子(self) -> None:
        print("梆——梆——")
    def 报时辰(self, 时辰: str) -> str:
        return f"{时辰}，小心火烛"

class 书生:
    def 念书(self) -> None: ...

def 上岗(人: 会打更) -> None:         # 类型检查器（mypy / pyright）会按结构检查
    人.敲梆子()

上岗(退伍兵())                        # ✅ 结构对得上
print(isinstance(退伍兵(), 会打更))   # True —— 只因为它“有”这两个方法
print(isinstance(书生(), 会打更))     # False
# 注意：runtime_checkable 只查“有没有”，不查参数对不对、能不能干好
```

|  | 继承抽象基类（ABC） | 结构化类型（Protocol） |
| --- | --- | --- |
| 怎么算“符合” | 必须显式写 `class X(Base)` | 有对应的属性和方法就算 |
| 谁来检查 | 实例化时检查抽象方法是否实现 | 静态类型检查器；加 `@runtime_checkable` 后 `isinstance` 也能粗查 |
| 耦合 | 实现方要 import 并依赖基类 | 实现方可以完全不知道接口的存在 |
| Harness² 的选择 | — | ✅ 接缝全部用 Protocol |

### 基准适配器：实现这些，整套方法就能跑

📄 harness2/core/spec.py · BenchmarkAdapter（节选，中文注释为本教程所加）

```python
@runtime_checkable
class BenchmarkAdapter(Protocol):
    """Implement these and the whole method works. Nothing here is method logic."""

    spec: BenchSpec                 # 这个基准的静态配置（第 11 站）
    substrate: SubstrateLike        # 用哪个执行器

    def tasks(self, split: str = "all") -> list[str]: ...          # 任务 id，顺序要稳定
    def domain_of(self, task_id: str) -> str: ...                  # 归属领域（经验库按它分）
    def task_prompt(self, task_id: str) -> str: ...                # 去掉评分标准后的任务原文
    def execute(self, task_id, harness_dir, run_id, *, timeout=None) -> Path: ...  # 跑一次，按 run_id 幂等
    def delivered(self, run_dir: Path) -> bool: ...                # 交没交出要求的产物
    def trajectory(self, run_dir: Path, *, obs_trunc: int) -> str: ...   # 统一语法的轨迹
    def deliverable_text(self, run_dir: Path) -> str: ...          # 交付物转成文本（盲选用）
    def base_harness(self) -> Path: ...                            # 起点 harness
    def validate_tree(self, tree: dict[str, str]) -> None: ...     # 基准自己的 harness 规则
    def score(self, run_dir: Path, task_id: str) -> dict | None: ...   # 只有 core.judge 在选择后调用
    # 另有两个可选方法：task_files()、deliverable_files()
```

> 🖐 动手演示「接入一个新基准」：请打开网页版体验。

### 执行器也分两层

方法核心对执行器的要求极少，只有 `SubstrateLike`：一个名字 + 一个 `surface()`（返回第 1 站的 `SurfaceSpec`）。真正“装马具、跑任务、读轨迹”的完整接口 `Substrate` 定义在 `substrate/base.py`，由基准适配器在内部使用：

| 接口 | 成员 | 谁用 |
| --- | --- | --- |
| `SubstrateLike`（core/spec.py） | `name`、`surface()` | 方法核心：只需要知道“能改哪些文件、规则是什么” |
| `Substrate`（substrate/base.py） | `surface()`、`materialise()`、`execute()`、`read_trajectory()`、`preflight()` | 基准适配器：把 harness 树装成框架原生文件、真正去跑 |

**一个有说服力的例子：demo 适配器**`harness2/demo.py` 里的 `DemoAdapter` 没有继承任何类，只是一个普通的 Python 类，实现了 `tasks`、`execute`、`trajectory` 等方法——它甚至**没有实现 `score()`**，因为方法本身从不调用评分。可整套“提议—试探—合成—盲选—反思”照样完整跑通。这就是 Protocol 解耦的威力。

除了三条主轴，提议器和选择器用哪个模型、走哪种通道，也是独立配置的：`ChannelSpec` 的 `kind` 只能是 `claude_cli` 或 `opencode`（第 11 站会看到它如何在构造时自检）。

**小测：**关于 `@runtime_checkable` 的 Protocol，下面哪句话是对的？

- A. isinstance 会检查每个方法的参数类型
- B. 实现类必须继承这个 Protocol 才能通过 isinstance
- C. 没有它就无法做静态类型检查
- D. isinstance 只检查成员是否存在，不检查签名和行为

<details><summary>看答案</summary>

**答案：D**　就像书吏只看梆子带没带。静态检查本来就能对 Protocol 生效；`@runtime_checkable` 只是额外允许运行时的 `isinstance` 粗查。

</details>

**本站带走三句话**

- 方法、执行器、基准三轴解耦，哪个变了只动哪个。
- 接缝用 `typing.Protocol`：只问结构、不问继承；`@runtime_checkable` 只查成员在不在。
- 接入新基准 = 写一个实现这些方法的普通类；方法核心一行不改。
