# 第 7 站｜挂铃铛的丝线

对应源码：[core/context.py](https://github.com/google-research/harness2/blob/main/harness2/core/context.py)、[core/spec.py](https://github.com/google-research/harness2/blob/main/harness2/core/spec.py)、[core/judge.py](https://github.com/google-research/harness2/blob/main/harness2/core/judge.py)、[core/prompts.py](https://github.com/google-research/harness2/blob/main/harness2/core/prompts.py)

**【寓言】**

### 挂铃铛的丝线

老锁匠收了几个徒弟，教他们给从没见过的锁配钥匙。每把锁的“标准钥匙”和师傅的评分单，都锁在后屋。

老锁匠常说：“徒弟要是摸到了标准钥匙，配出来的就不是手艺，是抄。”所以他做了好几件事。

头一件，他给徒弟下的每一句吩咐里，都不许出现“考核”“评分”“标准答案”这类字眼。“吩咐只讲活怎么干，不讲活怎么量。”

第二件，徒弟进工坊之前，他把可能夹着标准钥匙的几个抽屉先搬空。

第三件最费工夫：他在每道门、每扇窗上拉了**丝线，挂上小铃铛**，又在所有盖着评分印章的纸上系了线。只要有一张带评分章的纸出现在工坊里，或者夹在徒弟交上来的工具箱里，铃铛就响，活就停。

有一回铃铛真响了。徒弟们以为师傅会再多挂几串铃铛，可他没有。他顺着线一路找，找到是后屋一扇没关严的气窗，把纸吹进了工坊。“铃铛只管报信。该堵的是那扇窗，不是多挂铃铛。”

还有一回，一个徒弟没人叫他，自己跑到镇上的告示栏，把贴在那里的评分细则抄了回来——原来评分细则本来就是公开张贴的。老锁匠这才明白，光在屋里拉线不够，干脆把**通往镇上的那道院门**也锁了。

评分的师傅只在钥匙**交出去以后**才来。有一回他病了，没能评，账上记的是“未评”，而不是“零分”，算平均分时也不算这一把。

猜一猜：那几根挂铃铛的丝线，在 Harness² 里是什么？为什么光靠“不告诉徒弟答案”还不够？

> 🤔 先停一停：这个故事讲的是 Harness² 的哪个设计？想好了再往下读。

---

**【谜底揭晓】**

#### 谜底：无答案原则 + 防泄漏绊线（tripwire）

Harness² 的每个编辑器、合成器、选择器都在**没有标准答案、没有评分细则、没有分数**的条件下工作。代码用好几层机制守住这一点：提示词明确声明“你手里没有答案”；配置里禁止出现衡量类字眼；已知的答案文件路径在上下文生成前就被拒绝；再加一道**绊线**——一旦评分器自己的输出出现在模型上下文或 harness 里，立即报错停下。

### 故事 ↔ 代码对照

| 故事里 | Harness² 里 |
| --- | --- |
| 吩咐里不许出现“考核”“评分” | `BenchPrompts.__post_init__` 禁止 benchmark / evaluation / grader / rubric / score |
| 先搬空夹着标准钥匙的抽屉 | 基准声明 `leak_globs`，`assert_no_leak_paths` 在上下文到达模型前拒绝这些路径 |
| 丝线和铃铛 | `GRADER_VERDICT_MARKERS` + `assert_no_grader_verdicts`：按文件名和内容检查 |
| 工具箱里夹着评分纸也会响 | harness 树在执行或入库前也要过同一道绊线 |
| 堵窗，而不是多挂铃铛 | “find the read path that produced the match rather than widening the marker list” |
| 徒弟自己去告示栏抄评分细则 | 真实事件：一次 Codex 执行在 JobBench 上自己下载了任务的评分细则 |
| 锁上通往镇上的院门 | 官方建议在网络层屏蔽 huggingface.co、hf.co、github.com 等 |
| 交出去以后才评；病了记“未评” | judge 只在选择之后运行；失败返回 `None`，不是 0，也不进分母 |

### 五层防线

**① 提示词声明**`ANSWER_FREE`：上下文里没有任何评分细则、答案或分数，也别去猜“评分者想要什么”

→

**② 配置禁词**描述工作的文字里出现衡量类字眼，构造时就报错

→

**③ 答案路径**`leak_globs` 声明的文件，进上下文前拒绝

→

**④ 绊线**评分器输出的特征字符串出现在文件名或内容里，立即报错

→

**⑤ 隔离评分**judge 在选择之后才运行，方法代码从不导入它

📄 harness2/core/spec.py · BenchPrompts.\_\_post\_init\_\_（节选，中文注释为本教程所加）

```python
for field_name, value in visible.items():          # work、inv_levers、dom_levers……模型看得到的字段
    low = value.lower()
    for bad in ("benchmark", "evaluation", "grader", "rubric", "score"):
        if bad in low:                               # 注意：是子串匹配
            raise ValueError(
                f"BenchPrompts.{field_name} must describe the WORK, not its "
                f"measurement (found {bad!r}). Say what the practitioner needs."
            )
```

📄 harness2/core/context.py（节选，中文注释为本教程所加）

```python
GRADER_VERDICT_MARKERS: tuple[str, ...] = (     # 只有评分器的输出里才会出现的字符串
    "deterministic_eval_summary",
    "deterministic_eval_result",
    "judge_scope_and_deterministic_status",
    "Judge findings on the rendered result",
    '"passed_count"',                             # 带引号：匹配的是 JSON 键
    '"pass_rate"',
    '"test_pass_rate"',
)

def assert_no_grader_verdicts(root, markers=GRADER_VERDICT_MARKERS) -> None:
    """拒绝含有评分器输出的上下文目录：按文件名查，也按内容查。
    这是读取边界上的绊线，不是防线本身：如果它响了，去找产生匹配的那条读取路径，
    而不是扩大标记列表。"""
```

**设计要点：绊线 ≠ 防线**真正的防线是“适配器根本不去读评分相关的文件”。绊线只负责在防线失守时**大声报警**。所以报错信息特意写着：“this is a leak, not a false positive to widen around. Find the read path that produced it.”——这是泄漏，不是误报，去找是哪条读取路径带进来的。

> 🖐 动手演示「绊线试验台」：请打开网页版体验。

### 真实事件：评分细则就在公网上

项目文档 `docs/EXPERIMENTS.md` 记录了一件事：三个基准都是公开的，JobBench 还在 Hugging Face 上公布了每个任务的 `RUBRICS.json`。在一次验证运行中，**一个 Codex 执行在没有任何指示的情况下，自己下载了它所做任务的评分细则**。

**如果你要复现实验**这个版本**不限制**网络访问。安装完成后，请在执行器所在机器上屏蔽 `huggingface.co`、`hf.co`、`*.hf.co`、`github.com`、`raw.githubusercontent.com`。Codex 运行时沙箱是关闭的，所以要在**网络层**（出口防火墙或 DNS 策略）做限制，不要依赖工具设置；并在报告结果时注明用了哪些限制。

### 评分被关在“事后”

📄 harness2/core/judge.py（模块说明，原文）

```python
Nothing in the method imports this module. A judge failure is None, never a zero, and a None is
excluded from the denominator.
# 中文：方法里没有任何代码导入这个模块。评分失败记为 None，绝不是 0；None 不计入分母。
```

适配器接口里的 `score()` 方法也写明：“Called only by core.judge, only after selection committed.” 每条执行在方法内部的表示 `RunView` 也特意注明 “Never carries a score.”——从数据结构上就不给分数留位置。

**小测：**某个基准适配器的 `work` 描述写成 “Draft the memo; underscore the key risks.”，构造 `BenchPrompts` 时会发生什么？

- A. 正常通过，句子里没有禁词
- B. 只打印警告
- C. 抛出 ValueError：underscore 里含有子串 score
- D. 自动把 underscore 替换掉

<details><summary>看答案</summary>

**答案：C**　检查用的是 `bad in low` 子串匹配，宁严勿松。在下面的绊线试验台里也能试出来。写适配器时换个说法就好，比如 “highlight the key risks”。

</details>

**本站带走三句话**

- 全程无答案：编辑、合成、选择都只凭任务说明和执行轨迹做判断。
- 多层防线：提示词声明、配置禁词、答案路径拒绝、绊线、事后评分；绊线响了要堵路径，不要放宽。
- 评分细则可能就在公网上——复现实验时要在网络层屏蔽相关站点。
