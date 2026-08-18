# AI 阅读文档

## 项目定位

本项目是一个零依赖的静态前端，用于智慧中小学课程的辅助刷课、课程整理和多窗口学习管理。项目不包含后端服务、数据库或构建工具，运行时直接由浏览器加载根目录文件。

使用和修改时应遵守用户对课程数据的授权范围，以及智慧中小学相关平台的服务条款。不要在没有用户明确要求的情况下增加账号登录、自动提交学习记录、规避平台校验或批量操作第三方账号的逻辑。

## 文件职责

- `index.html`：页面骨架、课程列表、布局控制和全屏按钮。
- `styles.css`：Meta 风格视觉系统、桌面/移动布局、独立滚动和课程窗口尺寸。
- `app.js`：课程 JSON 加载、目录递归解析、SmartEdu URL 生成、窗口状态、布局切换和全屏逻辑。
- `course.json`：唯一课程数据源，可能被用户替换或更新，不要把课程条目复制到代码中。
- `README.md`：面向使用者的启动和使用说明。

## 数据解析规则

1. 通过 `fetch("course.json?...", { cache: "no-store" })` 获取最新 JSON。
2. 递归遍历顶层 `nodes` 和所有 `child_nodes`。
3. 活动资源优先读取 `node.relations.activity.activity_resources`，同时兼容 `activities` 和 `activity_list`。
4. 每条资源至少需要 `resource_id`；标题优先使用 `video_extend.title`，时长优先使用 `video_extend.files[].duration`。
5. `relations.activity.context_id` 的格式通常为 `library:<libraryId>.x_course:<courseId>.activity_set:<activitySetId>`。链接生成必须优先使用这里解析出的 `libraryId` 和 `courseId`，不能固定使用旧课程 ID。
6. `resource_id` 写入详情页 URL 的 `resourceId` 参数。课程标签和面包屑优先使用当前 JSON 的 `activity_set_name`。

## 交互约定

- `state.courses` 保存当前所有课程，`state.filteredCourses` 保存搜索结果。
- `state.selectedIds` 保存当前打开窗口的资源 ID。
- `state.layout` 是当前并行窗口上限，范围为 `1–20`。
- 标准布局为 `1`、`4`、`8`；自定义布局使用 `grid-custom`，窗口统一纵向排列。
- 超过窗口上限时移除最早加入的课程。
- 课程 JSON 刷新后，保留仍存在的已打开资源，自动移除已经不存在的资源。
- 全屏使用浏览器 Fullscreen API，课程 iframe 必须保留 `allow="fullscreen; autoplay"`。

## 修改要求

- 保持零依赖，不要无必要引入框架、打包器或后端。
- 不要把 `course.json` 的课程 ID、标题或链接硬编码到 HTML/CSS 中。
- 修改 URL 生成逻辑时，必须同时验证 `courseId`、`libraryId`、`tag`、`breadcrumb` 和 `resourceId`。
- 新增控件时补齐键盘操作、`aria-label` 和按钮悬停提示。
- 桌面端保持左侧课程列表独立滚动、右侧主内容独立滚动；移动端允许页面自然滚动。
- 课程窗口保持单列大尺寸，避免恢复为两行两列的小窗口。
- 不要提交用户的账号信息、Cookie、Token 或其他敏感数据。

## 验证方式

修改后至少执行：

```bash
node --check app.js
jq '[.. | objects | select(has("resource_id"))] | length' course.json
python3 -m http.server 5173
```

浏览器验证重点：

- 页面能显示最新课程数量和课程集名称。
- 点击刷新按钮后列表和课程链接同步更新。
- 课程链接使用当前 JSON 的 `context_id` 和 `resource_id`。
- 自定义 `1–20` 个窗口后，窗口上限、课程替换逻辑和当前数量提示一致。
- 全屏、退出全屏、搜索、清空窗口和移动端布局正常。
