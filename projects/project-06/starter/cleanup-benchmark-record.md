# 清理后基准运行记录

运行名称：清理后

日期：2026-10-15

应用目录：`projects/project-06/starter`。依赖已在，跳过 `npm install`。界面没有重置入口。先启动一次，日志里的数据目录是 `/Users/jiajiehuang/Library/Application Support/knowledge-base/knowledge-base-data`。当时 `Listing documents` 的 `count` 为 1。退出应用后删掉这个目录，再启动。干净启动时 `count` 为 0，界面是 `Documents (0)` / `No documents imported yet.`。没有改应用代码。

启动命令与 `npm run dev` 相同（这次在已编译的 `dist` 上执行 `electron .`），额外加了 `--remote-debugging-port=9222`，用来点击界面上的同一批按钮和输入框。T1 的控制台调用是考卷写明的那一步。

| 任务 | 结果 | 重试次数 | 缺陷（没有就写无） | 证据（你实际看到的界面或日志原文） |
|------|------|----------|--------------------|------------------------------------|
| T1 导入 | 带缺陷完成 | 1 | 必须改用控制台才能导入指定文件 | 文件选择第一次写入的是另一份同名文件，日志路径为 `.../projects/project-02/starter/data/sample-documents/retrieval-plan.md`，大小 1639。界面删除后列表回到 `Documents (0)`。再次打开文件选择，取消后列表仍是 `Documents (0)`，日志为 `IPC: IMPORT_DOCUMENT canceled`。按考卷在控制台执行 `window.knowledgeBase.documents.import(".../projects/project-06/starter/data/sample-documents/retrieval-plan.md")` 并点 `Refresh`。列表为 `Documents (1)`、`Retrieval Plan`、`1.9 KB`。详情：`Filename: retrieval-plan.md`，`Size: 1.9 KB`，`Status: imported`。日志：`{"timestamp":"2026-10-15T12:37:55.310Z","level":"INFO","service":"ipc-handlers","message":"IPC: IMPORT_DOCUMENT","data":{"filePath":"/Users/jiajiehuang/learn-harness-engineering/projects/project-06/starter/data/sample-documents/retrieval-plan.md"}}`，以及 `{"timestamp":"2026-10-15T12:37:55.311Z","level":"INFO","service":"document-service","message":"Document imported","data":{"documentId":"b5c9261a-fb90-4739-a41e-8e78556a0fc2","filename":"retrieval-plan.md","size":1931}}` |
| T2 索引 | 通过 | 0 | 无 | 打开文档后点 `Index Document`。列表变为 `Retrieval Plan` / `Indexed 1.9 KB`。详情：`Status: indexed`，`Chunks: 5`，`Index Document` 按钮消失。点 `Show Chunks (5)` 后按钮为 `Hide Chunks (5)`。Chunk 0 到 Chunk 4 都有序号和非空正文。Chunk 1 含 `Split on double newlines (paragraph boundaries)` 和 `~500 characters`。日志：`{"timestamp":"2026-10-15T12:38:38.030Z","level":"INFO","service":"ipc-handlers","message":"IPC: START_INDEXING","data":{"documentId":"b5c9261a-fb90-4739-a41e-8e78556a0fc2"}}` |
| T3 带引用的问答 | 通过 | 0 | 无 | 问题原文提交 1 次。回答：`The indexing pipeline splits documents into chunks of approximately 500 characters at paragraph boundaries.` 引用两条，标题都是 `Retrieval Plan`。chunk 1 摘录以 `Documents are split into chunks using a paragraph-aware algorithm: - Split on double newlines` 开头。chunk 2 摘录为 keyword matching。`Confidence: 85%`。日志：`{"timestamp":"2026-10-15T12:38:56.132Z","level":"INFO","service":"ipc-handlers","message":"IPC: ASK_QUESTION","data":{"question":"How does the indexing pipeline split documents into chunks?"}}`，以及 `{"timestamp":"2026-10-15T12:38:56.133Z","level":"INFO","service":"qa-service","message":"Answer generated","data":{"confidence":0.85,"citationCount":2}}` |
| T4 运行时日志 | 通过 | 0 | 无 | 同一次运行的终端里三条都是 JSON，且各有 `timestamp`、`level`、`service`、`message`。导入：`message` 为 `IPC: IMPORT_DOCUMENT`，服务 `ipc-handlers`，级别 `INFO`，时间 `2026-10-15T12:37:55.310Z`。索引：`message` 为 `IPC: START_INDEXING`，时间 `2026-10-15T12:38:38.030Z`。提问：`message` 为 `IPC: ASK_QUESTION`，随后 `Answer generated` 带 `confidence` 0.85 和 `citationCount` 2。命令行没有未处理异常。 |
| T5 重启后状态还在 | 通过 | 0 | 无 | 确认应用进程已结束，没有删数据目录，再次启动。`Listing documents` 的 `count` 为 1。列表直接是 `Documents (1)`、`Retrieval Plan`、`Indexed 1.9 KB`。详情：`Status: indexed`，`Chunks: 5`，`Show Chunks (5)`。`Show History` 打开后有一条 `Q: How does the indexing pipeline split documents into chunks?`，回答是 T3 那句按段落、约 500 字符切分的说明，并显示 `2 citation(s) \| Confidence: 85%`。没有重新导入或重新索引。 |

汇总：

- 基准完成率：5/5
- 严格通过率：4/5
- 重试次数合计：1
- 缺陷条数合计：1

和基线（2026-10-15 窗口记录）对照：基准完成率 4/5 → 5/5，严格通过率 1/5 → 4/5，重试 4 → 1，缺陷 4 → 1。T2、T3、T5 从带缺陷或失败变为通过。T1 仍要控制台才能导入指定路径。

歧义（不改考卷）：

- 索引服务日志原文是 `Single document indexed`。T2 和 T4 按考卷接受的 `START_INDEXING` 计为对上。
- 文件选择第一次落到 `project-02` 的同名 `retrieval-plan.md`。该条已从界面删除，不作为 T1 的通过证据。指定路径的导入是控制台那一次，所以 T1 记为带缺陷完成，重试 1 次。
- 引用摘录在界面上截到大约 100 个字符并带省略号。可见部分能对上 `retrieval-plan.md` 的分块说明，不记「截断到无法核对」。
