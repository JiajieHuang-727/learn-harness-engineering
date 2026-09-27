# 弱 harness 与强 harness 对比

对比两次会话 B。弱 harness 来自 `session-b-handoff-report-baseline.md`（分支 `p2-baseline-2`，没有 `session-handoff.md`）。强 harness 来自 `session-b-handoff-report-improved.md`（会话 A 提交了可执行的交接）。两边都把三个功能做完了。差别在接手有多快，以及进度是从仓库里读出来的，还是又查出来的。

| | 弱 harness | 强 harness |
| --- | --- | --- |
| 到第一处代码 | 1 分 40 秒 | 2 分 17 秒 |
| 到第一处有效修改 | 1 分 40 秒（代码） | 1 分 45 秒（文档），随后 2 分 17 秒写代码 |
| 实现结束 | 2 分 11 秒 | 2 分 55 秒 |
| 重新发现 | 9 次（31/65，48%） | 6 次（20/50，40%） |
| 交接 | 没有 `session-handoff.md`。`feature_list` 状态准确，下一步不可执行 | 完整、准确、可操作。下一步是四步 |
| 完成 | 3/3。窗口重启没点过 | 3/3。没有重新跑 `npm run dev` |

## 接手速度

墙上时钟里，弱 harness 更早碰到代码：1 分 40 秒对 2 分 17 秒，实现结束是 2 分 11 秒对 2 分 55 秒。这两个数字不能直接当成“弱交接更快”。

计时起点不同。弱 harness 从会话记录创建（14:44:18）算到第一次写入 `ipc-handlers.ts`（14:45:58）。强 harness 从会话 A 的提交（11:32:28）算到第一次写入 `persistence-service.ts`（11:34:45）。强 harness 的用户消息只有分钟精度，报告自己写了实际间隔可能短到约 1 分 46 秒。

剩下的工作量也不同。弱 harness 的会话 A 已经把正文和元数据写进 `documents-meta.json` 与 `content/<id>.txt`，会话 B 补的是挂载时 `refreshDocuments()`、状态栏计数和一条重启测试。强 harness 的会话 A 把导入留在内存里，会话 B 要做完复制源文件、写正文、写元数据、删除时清文件、启动时刷新。强 harness 还按约定先改文档，第一处文档修改在 1 分 45 秒，比弱 harness 的第一处代码只晚 5 秒。

所以这次实验里，交接没有把“第一行代码”提前。它把第一处有效修改用在文档上，并且接下来要写的持久化范围更大。速度上的可见收益是：有了四步说明之后，会话 B 没有先花时间判断“落盘到底做没做完”。

## 上下文恢复质量

强 harness 恢复的是一份可执行的进度。弱 harness 恢复的是一个状态标签。

弱 harness 开始时没有 `session-handoff.md`。`feature_list.json` 把持久化标成 `not-started`，evidence 为空。`ARCHITECTURE.md` 有存储布局，没有写启动时不加载列表。会话 B 因此知道“还要做持久化”，但不知道缺口只是挂载刷新。功能名和 `not-started` 还和代码不一致：磁盘写入已经在 `DocumentService` 里。它读完服务才把范围收窄，中间翻了 solution、project-03 和上一会话的聊天记录。9 次重新发现里，有一次就是因为仓库里没有交接，去翻聊天记录。

强 harness 开始时读到的 `session-handoff.md` 写了已完成、未完成、决策和下一步。未完成段写明重启后库是空的。下一步是四步：复制源文件，写 `content/<id>.txt` 和 `documents-meta.json`，删除时清掉这些文件，挂载时调用 `refreshDocuments()`。这和当时代码一致：导入只在内存，`PersistenceService` 已注入但没用，`App` 没有在挂载时刷新。不看 solution 也能按这四步做。

重新发现因此少，而且性质不同。弱 harness 的 9 次里，有几次是在补仓库没写的事实（真实缺口、状态栏形状、上一会话说过什么）。强 harness 的 6 次是在重查交接里已经写过的符号、命令和 `useEffect` 刷新。交接把重复查找变成多余确认，而不是唯一信息来源。工具调用比例从 48%（31/65）降到 40%（20/50）。两次都没有重写导入面板和详情视图。

强 harness 的交接仍有两处没挡住实现：删除步骤没点名 `chunks/<id>.json` 和 `index-meta.json`；没写明旧测试还在断言“不要写盘”。会话 B 读 `IndexingService` 后补了索引清理，并改了测试。这是交接的缺口，不是进度丢失。

## 结论

接手速度在这两次运行里接近，弱 harness 的第一处代码更早，主要因为剩余改动更小，而且计时从会话开始算。强 harness 的第一处有效修改（文档）是 1 分 45 秒，和弱 harness 的 1 分 40 秒在同一量级。

上下文恢复质量差在交接能不能当操作说明用。弱 harness 靠 `feature_list` 的状态标签开工，真实缺口要读代码和聊天记录才能确定，48% 的工具调用花在重新确认上。强 harness 的 `session-handoff.md` 把未完成和下一步写成四步，和代码一致，会话 B 按文件就能做持久化。重新发现从 9 次降到 6 次，重复比例从 48% 降到 40%，而且这 6 次查的是交接里已经有的答案。
