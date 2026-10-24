# 第 11 站｜刻进石碑的章程

对应源码：[core/spec.py](https://github.com/google-research/harness2/blob/main/harness2/core/spec.py)、[core/tree.py](https://github.com/google-research/harness2/blob/main/harness2/core/tree.py)、[core/schedule.py](https://github.com/google-research/harness2/blob/main/harness2/core/schedule.py)

**【寓言】**

### 刻进石碑的章程

行会的章程原先写在纸上，挂在各分号的墙上。纸上的字谁都能用铅笔改两笔。有一年，南边分号把“学徒期三年”悄悄改成了“两年”，北边分号不知道，两边带出来的学徒一碰面，差点打起来。更糟的是，没人说得清是哪天、谁改的。

新任会首定了新规矩：**章程刻在石碑上**。

刻碑之前，石匠要拿着行会的根本法，把每一条逐字核对：有没有写错的名目、有没有低于底线的数字、该指定的见证人有没有指定。**有一条不合，整块碑就不刻**。“宁可当场刻不成，也别刻好了立在那里，三个月后才发现是错的。”

碑一旦刻成，谁也改不了一个字。真要改，就**另刻一块新碑**：没变的条文照抄，变的那条换掉——新碑刻之前，照样要逐条核对。

有几条是捆在一起的。比如“走哪条驿路”和“派哪位信使”：“只换路不换人，或者只换人不换路，信都会送丢。要换，两条一起换。”

当然，不是什么都刻石头。每天的流水账、谁今天出了几趟工，还是记在纸本子上，随时往上添。会首说：“章程刻石，账本用纸。一块碑说的是‘这件事是什么’，不是‘这件事怎么干’。”

猜一猜：“刻进石碑、刻前逐条核对、要改就另刻一块”，对应 Python 里的哪种写法？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：`@dataclass(frozen=True)` + `__post_init__` 校验 + `dataclasses.replace`

Harness² 的所有**配置类**（`SurfaceSpec`、`ChannelSpec`、`BenchPrompts`、`BenchSpec`、`Namespace` 等）都是**冻结的数据类**：创建后不能修改；创建时在 `__post_init__` 里把所有约束检查一遍，不合法**当场报错**；需要变体时用 `replace()` 生成一个新值——新值同样要过校验。而记录运行过程的类（`RunView`、`Stage`、`Ledger`、`Selection`）是普通可变数据类。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 刻在石碑上，一字不能改 | `@dataclass(frozen=True)`：给字段赋值会抛 `FrozenInstanceError` |
| 刻前逐条核对，有一条不合就不刻 | `__post_init__` 校验：对象根本创建不出来 |
| 另刻一块新碑，没变的照抄 | `dataclasses.replace(旧值, 字段=新值)`，同样会触发校验 |
| 路和信使要一起换 | `resolve_channel_model`：通道和模型**必须一起覆盖** |
| 章程刻石，账本用纸 | 配置冻结；运行记录（RunView、Stage、Ledger）可变 |
| 碑说的是“是什么” | “A value, not a code path.”（BenchSpec 的文档字符串） |

### Python 语法小课：冻结数据类

📄 示例（本教程原创，已在 Python 3.13 上运行验证）

```python
from dataclasses import dataclass, replace, FrozenInstanceError

@dataclass(frozen=True)                 # ① 冻结：创建后字段不可再赋值
class 章程:
    名称: str
    巡更间隔: int = 120

    def __post_init__(self):            # ② 创建时自动调用：在这里做校验
        if self.巡更间隔 < 60:
            raise ValueError(f"巡更间隔={self.巡更间隔} 太短，至少 60")

c = 章程("东街")
c.巡更间隔 = 30        # × FrozenInstanceError: cannot assign to field '巡更间隔'
章程("西街", 30)       # × ValueError: 巡更间隔=30 太短，至少 60 —— 对象根本不会诞生
d = replace(c, 巡更间隔=90)   # ③ 要变体就“另刻一块”：章程(名称='东街', 巡更间隔=90)
replace(c, 巡更间隔=10)       # × 同样触发 __post_init__ 校验，抛 ValueError
```

冻结带来的额外好处：冻结且字段可哈希的实例可以当字典的键、放进集合；多线程共享时不用担心被谁偷偷改掉（第 12 站的并发正依赖这一点）。

### Harness² 里的“石碑”

📄 harness2/core/spec.py · BenchSpec（节选，中文注释为本教程所加）

```python
@dataclass(frozen=True)
class BenchSpec:
    """Static description of one (benchmark, substrate) cell. A value, not a code path."""
    name: str
    runs_root: Path
    install_mode: str
    prompts: BenchPrompts
    channels: dict[str, ChannelSpec]
    leak_globs: tuple[str, ...] = ()             # 第 7 站：答案文件的路径模式
    allow_subagents: bool = False
    reserved_scripts: frozenset[str] = frozenset()
    obs_trunc: int = 50_000                      # 第 9 站：单条观察的截断长度
    ...

    def __post_init__(self) -> None:
        if self.install_mode not in INSTALL_MODES:            # 名目必须合法
            raise ValueError(f"unknown install_mode {self.install_mode!r}; ...")
        for role in ("proposer", "selector"):                  # 两个角色的通道都得指定
            if role not in self.channels:
                raise ValueError(f"BenchSpec.channels must define {role!r}")
        if self.obs_trunc < 10_000:                            # 数字不能低于底线
            raise ValueError(f"obs_trunc={self.obs_trunc} is in the range that fabricates "
                             f"defects; use >= 10_000 (default 50_000)")
        bad = sorted(s for s in self.reserved_scripts if "/" in s or not s.endswith(".py"))
        if bad:                                                # 只收文件名，不收路径
            raise ValueError(f"BenchSpec.reserved_scripts takes bare .py BASENAMES, not paths: {bad}")
```

📄 harness2/core/spec.py · resolve\_channel\_model（节选）

```python
def resolve_channel_model(kind, model, *, effort="high", steps=120, timeout=3600) -> ChannelSpec:
    """唯一的“通道→模型”映射；只覆盖其中一个就报错。"""
    if (kind is None) != (model is None):
        raise ValueError(
            "channel and model must be overridden TOGETHER (a bare-id/provider-prefixed "
            f"mismatch fails silently downstream); got kind={kind!r}, model={model!r}")
    # 中文：通道和模型必须一起覆盖（模型 id 的写法和通道不匹配时，下游会静默失败）
```

真实用法：LAB 基准按“业务领域 + 工作类型”为每个任务拼出不同的领域指引，用的正是 `return replace(LAB_BASE, domain_guidance=guidance)`——新生成的 `BenchPrompts` 同样要过第 7 站的禁词检查。

> 🖐 动手演示「石碑控制台」：请打开网页版体验。

**设计要点：把错误前移到“创建的那一刻”**研究流水线一跑就是几个小时、花真金白银。如果 `obs_trunc` 写成 5000，要等到编辑器读了一堆被剪碎的轨迹、提出一堆子虚乌有的修改后才被发现，代价巨大。冻结 + 创建即校验让这类错误**在程序启动的第一秒**就暴露，而且一旦创建成功，整个运行期间都不会被改坏。配合 `harness2 --dry-run`，几乎所有配置问题都能在花第一分钱之前发现。

**小测：**想让某个基准用更长的截断长度，下面哪种写法符合 Harness² 的风格？

- A. `spec2 = replace(spec, obs_trunc=80_000)`
- B. `spec.obs_trunc = 80_000`
- C. `object.__setattr__(spec, "obs_trunc", 80_000)`
- D. 在运行到一半时修改全局变量

<details><summary>看答案</summary>

**答案：A**　B 会抛 `FrozenInstanceError`；C 能绕过冻结，但也绕过了校验，破坏了“值不可变”的约定；`replace` 生成新值并重新校验。

</details>

**本站带走三句话**

- 配置是“值”：冻结数据类，创建即校验，要变体用 `replace`。
- 捆绑的参数必须一起覆盖，避免“静默失败”。
- 配置冻结、运行记录可变：章程刻石，账本用纸。
