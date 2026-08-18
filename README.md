# 智慧中小学辅助刷课工作台

这是一个面向智慧中小学课程学习场景的本地辅助刷课项目。项目读取同目录的 `course.json`，解析课程目录和视频资源，并将课程详情页放入可操作的并行窗口中，方便课程整理、批量查看和学习过程管理。

请仅在本人有权访问的账号和课程范围内使用，并遵守智慧中小学及相关平台的服务条款、学习要求和单位管理规定。

## 功能

- 自动读取 `course.json` 中的课程目录、标题、时长和 `resource_id`。
- 根据 JSON 的 `context_id` 动态生成当前课程的 SmartEdu 详情页链接。
- 支持单开、四开、八开，以及自定义同时打开 `1–20` 个窗口。
- 每个窗口纵向排列，支持单窗口全屏，便于操作课程内容。
- 左侧课程列表支持搜索、独立滚动和手动重新读取 JSON。
- 更新 JSON 后点击课程列表旁的“刷新”按钮即可重新加载，已不存在的旧窗口会自动移除。

## 快速启动

项目没有构建步骤和第三方依赖。由于浏览器限制，不能直接用 `file://` 打开页面，需要启动本地 HTTP 服务：

```bash
cd /path/to/Project_Vocation
python3 -m http.server 5173
```

然后访问：

```text
http://localhost:5173
```

也可以使用其他静态文件服务器，只要它能同时提供 `index.html`、`app.js`、`styles.css` 和 `course.json` 即可。

## 使用流程

1. 确认新的课程数据已保存为项目根目录下的 `course.json`。
2. 打开页面，等待左侧课程列表加载完成。
3. 点击课程条目，将课程加入学习窗口。
4. 使用“自定义”输入框设置同时打开的窗口数量，输入 `1–20` 后点击确认或按 `Enter`。
5. 点击窗口标题栏中的“全屏”操作课程内容，按 `Esc` 退出全屏。
6. 更新 `course.json` 后，点击左侧列表旁的“刷新”按钮。

当打开的课程数量超过当前并行上限时，系统会自动移除最早打开的窗口，并加入最新选择的课程。

## 数据要求

项目主要读取以下字段：

- `nodes`：课程目录树。
- `child_nodes`：目录下的子目录或活动节点。
- `relations.activity.context_id`：用于提取当前课程的 `courseId` 和 `libraryId`。
- `relations.activity.activity_resources`：课程资源列表。
- `resource_id`：拼接详情页 `resourceId` 的资源 ID。
- `video_extend.title`：视频标题。
- `video_extend.files[].duration` 或 `study_time`：课程时长。

链接参数会按以下优先级处理：优先读取当前 JSON 的上下文信息；如果 JSON 没有可解析的上下文，则使用 `app.js` 中的默认值。

## 项目文件

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面结构和交互控件 |
| `styles.css` | Meta 风格界面、响应式布局和窗口样式 |
| `app.js` | JSON 解析、链接生成、窗口管理和全屏逻辑 |
| `course.json` | 课程数据源 |
| `Agents.md` | 面向 AI 和后续开发者的维护说明 |

## 常见问题

### 课程列表没有更新

确认文件名和路径为 `course.json`，然后点击左侧刷新按钮。若页面仍是旧版本，先使用浏览器强制刷新：macOS 按 `Cmd + Shift + R`，Windows/Linux 按 `Ctrl + Shift + R`。

### 课程页无法显示

确认网络连接和 SmartEdu 登录状态。部分站点可能限制 iframe 嵌入；此时可使用窗口中的全屏操作，或在浏览器新标签页中打开对应课程详情页。

### 页面显示“无法读取 course.json”

通常是直接双击 HTML 文件打开导致的。请按照“快速启动”中的方式运行本地 HTTP 服务。
