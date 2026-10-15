# 基线基准测试记录

运行名称：基线（starter，分支 `p06-baseline`）

日期：2026-10-15。依赖已在，跳过了 `npm install`。启动前退出应用，日志里的数据目录是 `/Users/jiajiehuang/Library/Application Support/knowledge-base/knowledge-base-data`，删掉后重新启动，文档列表为 0。界面上没有重置入口。没有改应用代码。

| 任务 | 结果 | 重试次数 | 缺陷数 | 缺陷（没有就写无） | 证据 |
|------|------|----------|--------|--------------------|------|
| T1 导入 | 带缺陷完成 | 1 | 1 | 必须用控制台才能导入 | 点 `+ Import` 后仍是 `Documents (0)` / `No documents imported yet.`。按考卷在控制台执行 `window.knowledgeBase.documents.import(...)` 后点 `Refresh`，列表出现 `retrieval-plan` 和 `1.9 KB`。详情是 `Filename: retrieval-plan.md`、`Size: 1.9 KB`、`Status: imported`。标题是 `retrieval-plan`，不是 `Retrieval Plan`。日志：`{"timestamp":"2026-10-15T11:00:37.831Z","level":"INFO","service":"ipc-handlers","message":"IPC: IMPORT_DOCUMENT","data":{"filePath":".../data/sample-documents/retrieval-plan.md"}}` |
| T2 索引 | 带缺陷完成 | 1 | 1 | 状态字段一直不是 indexed；第一次打开 chunk 列表是空的 | 打开文档后点 `Index Document`，再点 `Show Chunks`，按钮变成 `Hide Chunks (0)`，没有正文。离开详情再回来，变成 `Hide Chunks (5)`，能看到 `Chunk 0` 到 `Chunk 4` 的非空正文，其中 Chunk 1 含 `paragraph boundaries` 和 `~500 characters`。详情仍是 `Status: imported`。日志：`{"timestamp":"2026-10-15T11:01:17.271Z","level":"INFO","service":"ipc-handlers","message":"IPC: START_INDEXING","data":{"documentId":"441a4d22-1e03-4490-9a60-7e2dd03fe807"}}`，随后 `Single document indexed` 的 `chunkCount` 为 5。落盘 `documents-meta.json` 的 `status` 仍是 `imported` |
| T3 带引用的问答 | 失败 | 2 | 0 | 无 | 问题原文提交后，回答是：`Documents are imported by copying the source file to the local data directory...`。没有引用，没有 `Retrieval Plan`，置信度是 `Confidence: 30%`。回到索引再问，界面不变。日志：`{"timestamp":"2026-10-15T11:01:21.768Z","level":"INFO","service":"qa-service","message":"Answer generated","data":{"confidence":0.3,"citationCount":0}}`。`qa-history.json` 里五条记录的 `citations` 都是空数组 |
| T4 运行时日志 | 通过 | 0 | 0 | 无 | 同一次运行里三条都是带 `timestamp`、`level`、`service`、`message` 的 JSON：导入 `IPC: IMPORT_DOCUMENT`，索引 `IPC: START_INDEXING`，提问 `IPC: ASK_QUESTION` 与 `Answer generated` |
| T5 重启后状态还在 | 带缺陷完成 | 0 | 1 | 列表标题和状态对不上考卷要求的 indexed / Retrieval Plan | 完全退出并确认进程结束后，未删数据再次启动。列表仍是 `Documents (1)`、`retrieval-plan`、`1.9 KB`。详情仍是 `Status: imported`，并显示 `Show Chunks (5)`。`Show History` 能打开，里面有原问题 `How does the indexing pipeline split documents into chunks?` 和当时那句导入说明回答 |

汇总：

- 基准完成率：4/5（通过或带缺陷完成）
- 严格通过率：1/5（只有 T4）
- 重试次数合计：4
- 缺陷条数合计：3（T1、T2、T5 各 1）

记在当次运行里的歧义：T1 和 T5 的标题对不上 `Retrieval Plan`，但文件名和大小能确认就是 `retrieval-plan.md`，所以这两条记成带缺陷完成。T2 的 chunk 内容是齐的，缺的是 `indexed` 状态。T3 的终端里有 5 次 `ASK_QUESTION`，记分按考卷上限记 2 次重试；用完重试后引用数仍是 0，结果记失败。
