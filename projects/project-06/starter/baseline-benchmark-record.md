# 基线基准运行记录

运行名称：基线

日期：2026-10-15

应用目录：`projects/project-06/starter`。依赖已在，跳过 `npm install`。界面没有重置入口。先启动一次，日志里的数据目录是 `/Users/jiajiehuang/Library/Application Support/knowledge-base/knowledge-base-data`。当时 `Listing documents` 的 `count` 为 1。退出应用后删掉这个目录，再启动。干净启动时 `count` 为 0，界面是 `Documents (0)` / `No documents imported yet.`。没有改应用代码。

启动命令与 `npm run dev` 相同（`tsc -p tsconfig.node.json`、`vite build`、`electron .`），额外加了 `--remote-debugging-port=9222`，用来点击界面上的同一批按钮和输入框。T1 的控制台调用是考卷写明的那一步。

| 任务 | 结果 | 重试次数 | 缺陷数 | 缺陷（没有就写无） | 证据（你实际看到的界面或日志原文） |
|------|------|----------|--------|--------------------|------------------------------------|
| T1 导入 | 带缺陷完成 | 1 | 1 | 必须改用控制台才能导入 | 点 `+ Import` 后仍是 `Documents (0)` / `No documents imported yet.`。控制台执行 `window.knowledgeBase.documents.import(".../data/sample-documents/retrieval-plan.md")` 后点 `Refresh`，列表为 `Documents (1)`、`retrieval-plan`、`1.9 KB`。详情：`Filename: retrieval-plan.md`，`Size: 1.9 KB`，`Status: imported`。标题是 `retrieval-plan`，不是 `Retrieval Plan`。日志：`{"timestamp":"2026-10-15T11:47:41.003Z","level":"INFO","service":"ipc-handlers","message":"IPC: IMPORT_DOCUMENT","data":{"filePath":"/Users/jiajiehuang/learn-harness-engineering/projects/project-06/starter/data/sample-documents/retrieval-plan.md"}}` |
| T2 索引 | 带缺陷完成 | 1 | 1 | 状态字段一直是 `imported`，无法核对为 `indexed` | 打开文档后点 `Index Document`，再点 `Show Chunks`，按钮变成 `Hide Chunks (0)`，没有正文。打开历史再回到详情，按钮是 `Show Chunks (5)`。展开后有 Chunk 0 到 Chunk 4，正文非空。Chunk 1 含 `Split on double newlines (paragraph boundaries)` 和 `~500 characters`。详情仍是 `Status: imported`，列表只有 `retrieval-plan` 和 `1.9 KB`，没有 Indexed。日志：`{"timestamp":"2026-10-15T11:47:52.178Z","level":"INFO","service":"ipc-handlers","message":"IPC: START_INDEXING","data":{"documentId":"425a5bef-9a65-43d8-b859-3c1f11e3385a"}}` |
| T3 带引用的问答 | 失败 | 2 | 1 | 回答没有引用，置信度不是 85%，关键字段缺失 | 问题原文提交了 3 次。第 2、第 3 次都先回到 `Index Document` 再问。三次界面都是：`Documents are imported by copying the source file to the local data directory. The system extracts text content and creates metadata including title, filename, size, and import timestamp. After import, documents can be indexed for search.` 然后 `Confidence: 30%`。没有 Citations，没有 `Retrieval Plan`。回答没有提到按段落或大约 500 字符切分。日志：`{"timestamp":"2026-10-15T11:48:09.025Z","level":"INFO","service":"qa-service","message":"Answer generated","data":{"confidence":0.3,"citationCount":0}}` |
| T4 运行时日志 | 通过 | 0 | 0 | 无 | 同一次运行的终端里三条都是 JSON，且各有 `timestamp`、`level`、`service`、`message`。导入：`message` 为 `IPC: IMPORT_DOCUMENT`，服务 `ipc-handlers`，级别 `INFO`。索引：`message` 为 `IPC: START_INDEXING`。提问：`message` 为 `IPC: ASK_QUESTION`，随后 `Answer generated` 带 `confidence` 和 `citationCount`。命令行没有未处理异常。 |
| T5 重启后状态还在 | 带缺陷完成 | 0 | 1 | 重启后状态仍是 `imported`，标题不是 `Retrieval Plan`，无法核对为 indexed | 确认应用进程已结束，没有删数据目录，再次启动。`Listing documents` 的 `count` 为 1。列表直接是 `Documents (1)`、`retrieval-plan`、`1.9 KB`，没有重新导入。详情：`Status: imported`，`Show Chunks (5)`，`Index Document` 仍在。`Show History` 打开后能看到三次 `Q: How does the indexing pipeline split documents into chunks?`，以及当时那句导入说明回答。 |

汇总：

- 基准完成率：4/5
- 严格通过率：1/5
- 重试次数合计：4
- 缺陷条数合计：4

歧义（不改考卷）：

- 索引服务日志原文是 `Single document indexed`。T2 和 T4 按考卷接受的 `START_INDEXING` 计为对上。
- T1 的标题通过条件是 `Retrieval Plan`。界面标题是文件名去扩展名后的 `retrieval-plan`。文档已经进列表，文件名和大小也能核对，所以 T1 记为带缺陷完成，不记为通过。
- T5 的文档、5 个 chunk 和问答历史都还在界面上，不需要重新导入。状态从未变成 `indexed`，所以这条不能记为通过。
