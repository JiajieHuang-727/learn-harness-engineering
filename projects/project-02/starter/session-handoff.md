# Session Handoff

会话 B（弱 harness）结束时补写。开始动手时这个文件不存在，没有参与本次接手。

## Verified Now

- What is currently working:
  - 文档导入：`.txt` / `.md`，上限 10 MB，经 `documents:import` 写入本地数据目录。
  - 文档详情：`documents:get-content` 显示全文、元数据和删除按钮。
  - 基本持久化：元数据在 `documents-meta.json`，正文在 `content/<id>.txt`。写入是临时文件再改名。窗口启动时会调用 `documents.list()`，不用点 Refresh。删除会同时去掉元数据、正文、分块和 `index-meta.json` 里的对应项。
- What verification actually ran:
  - `npm test`：3 个测试通过，含“新开一个 DocumentService 仍能读回元数据和全文”。
  - `npm run check` 通过。
  - 没有在 Electron 窗口里重新走一遍导入和重启。当时终端里的 `npm run dev` 还是改代码之前的进程。

## Changed This Session

- Code or behavior added:
  - `src/services/persistence-service.ts`：`writeJson` / `writeText` 改为原子写入，新增 `deleteFile`。
  - `src/services/document-service.ts`：删除时清理正文、分块和索引元数据。
  - `src/renderer/App.tsx`：启动时加载已保存的文档列表，状态栏的文档数用列表长度。
  - `src/services/indexing-service.ts`：状态改成 `AppStatus`；单篇索引会写入 `index-meta.json`。
  - `src/services/document-service.test.ts`：增加重启恢复测试。
  - `feature_list.json`：`basic-persistence` 标为 `pass`。
- Infrastructure or harness changes:
  - 本文件。`docs/ARCHITECTURE.md` 和 `docs/PRODUCT.md` 没有加厚。没有 `claude-progress.md`。

## Broken Or Unverified

- Known defect: 无已知功能回退。导入和详情的会话 A 改动仍在工作区里，未单独再测。
- Unverified path: 真正关掉 Electron 再打开，看左侧列表是否自动出现。需要重新运行 `npm run dev`。
- Risk for the next session: 会话 A 和会话 B 的改动都还没提交，混在同一份未提交 diff 里。

## Next Best Step

- Highest-priority unfinished feature: 三个产品功能在 `feature_list.json` 里都已是 `pass`。若继续，先在窗口里确认重启恢复。
- Why it is next: 持久化的界面路径只靠单元测试，没有在正在运行的应用里看过。
- What counts as passing: 导入一份文档，退出进程，再执行 `npm run dev`，列表里直接有该文档，点开能看到全文。
- What must not change during that step: 导入校验、`documents:get-content`、数据目录 `userData/knowledge-base-data`。

## Commands

- Startup: `cd projects/project-02/starter && npm install && npm run dev`
- Verification: `npm test && npm run check`
- Focused debug command: `npx vitest run src/services/document-service.test.ts`
