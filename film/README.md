# 🎬 寓言动画《换马具》

约 3 分钟的全中文动画短片，用一则雪岭驿站的寓言讲 Harness² 的核心设计：
**马不换（模型权重不改），只换马具（harness）**；一个任务里反复改马具是第一层，跨任务带着经验改是第二层。

讲法沿用本教程的 **大纲 → 细节 + 寓言引导**：前 2 分多钟只讲故事，概念名称到最后才揭晓。

| 故事里 | Harness² 里 |
| --- | --- |
| 驿马 | 大模型（权重不改） |
| 马具：锦囊、木牌、蹄铁、话 | harness：提示词、工具说明、技能、脚本…… |
| 路书上的足迹 | 执行记录（执行轨迹） |
| 铜匠 / 银匠 | 两位“编辑”：通用改动 / 领域改动 |
| 帘子后只看包裹的管事 | 盲选：只看交付物，不看是谁改的 |
| 按地方分本的日志 | 经验库：按领域分本，只进同领域 |

> 寓言和画面是示意；片尾的提升数字（+11.5 / +4.5 / +11.8）出自 harness2 项目 README。

## 文件

```text
storyboard.md   分镜：事实表、13 个镜头、46 条字幕
props.js        共用道具（马、人物、路书、驿站、雪路……）
ch1.js–ch4.js   四章画面          film.js   字幕、镜头调度、音效事件
index.html      入口
```

## 重新渲染

需要 [vibe-knowledge-film](https://github.com/HeyChengC/vibe-knowledge-film) 引擎（Python 3 + Playwright Chromium + ffmpeg）：

```bash
git clone https://github.com/HeyChengC/vibe-knowledge-film
cd vibe-knowledge-film
python3 engine/render.py /path/to/learn-harness2/film --jobs 4   # 逐帧渲染
python3 engine/render.py /path/to/learn-harness2/film --events   # 导出音效事件
python3 engine/audio.py  /path/to/learn-harness2/film            # 合成 → film/renders/final.mp4
```

预览：`python3 engine/render.py /path/to/learn-harness2/film --serve`，或 `--sheet 10 60 120` 抽帧看。
