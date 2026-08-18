const COURSE_FILE = "course.json";
const COURSE_PAGE = "https://www.smartedu.cn/jiaoshi/courseDetail";
const COURSE_ID = "058fa244-f310-41e8-a73b-2853030db536";
const COURSE_TAG = "2026年“暑期教师研修”专题（职业教育、高等教育）";
const LIBRARY_ID = "bb042e69-9a11-49a1-af22-0c3fab2e92b9";

const state = {
  courses: [],
  filteredCourses: [],
  selectedIds: [],
  layout: 4,
  pageContext: {
    courseId: COURSE_ID,
    libraryId: LIBRARY_ID,
    tag: COURSE_TAG,
  },
};

const elements = {
  courseSetName: document.querySelector("#course-set-name"),
  courseSetMeta: document.querySelector("#course-set-meta"),
  courseSearch: document.querySelector("#course-search"),
  courseList: document.querySelector("#course-list"),
  visibleCount: document.querySelector("#visible-count"),
  refreshCourses: document.querySelector("#refresh-courses"),
  totalCourses: document.querySelector("#total-courses"),
  totalHours: document.querySelector("#total-hours"),
  parallelLimit: document.querySelector("#parallel-limit"),
  activeTag: document.querySelector("#active-tag"),
  workspaceGrid: document.querySelector("#workspace-grid"),
  clearButton: document.querySelector("#clear-button"),
  customLayout: document.querySelector("#custom-layout"),
  customLayoutInput: document.querySelector("#custom-layout-input"),
  applyCustomLayout: document.querySelector("#apply-custom-layout"),
  openAllButton: document.querySelector("#open-all-button"),
  toast: document.querySelector("#toast"),
};

function formatDuration(seconds) {
  const totalSeconds = Number(seconds) || 0;
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} 小时 ${remainingMinutes} 分` : `${hours} 小时`;
}

function formatCompactHours(seconds) {
  const hours = (Number(seconds) || 0) / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

function titleFromActivity(activity, fallbackIndex) {
  return activity?.video_extend?.title || activity?.document_extend?.title || `课程 ${String(fallbackIndex).padStart(2, "0")}`;
}

function flattenActivities(nodes, parents = [], result = []) {
  for (const node of nodes || []) {
    const nodePath = [...parents, node.node_name].filter(Boolean);
    const activities = node.relations?.activity?.activity_resources || node.activities || node.activity_list || [];
    for (const activity of activities) {
      if (!activity.resource_id) continue;
      const duration = activity.video_extend?.files?.find((file) => file.duration)?.duration || activity.study_time || 0;
      result.push({
        id: activity.resource_id,
        title: titleFromActivity(activity, result.length + 1),
        duration,
        durationLabel: formatDuration(duration),
        category: nodePath.join(" / "),
        cover: activity.video_extend?.front_cover_url || activity.document_extend?.front_cover_url || "",
        type: activity.resource_type || "video",
      });
    }
    flattenActivities(node.child_nodes, nodePath, result);
  }
  return result;
}

function findContextId(nodes) {
  for (const node of nodes || []) {
    const contextId = node.relations?.activity?.context_id;
    if (contextId) return contextId;
    const nestedContextId = findContextId(node.child_nodes);
    if (nestedContextId) return nestedContextId;
  }
  return "";
}

function pageContextFromData(data) {
  const contextId = findContextId(data.nodes);
  const match = contextId.match(/^library:([^.]+)\.x_course:([^.]+)\./);
  return {
    courseId: match?.[2] || COURSE_ID,
    libraryId: match?.[1] || LIBRARY_ID,
    tag: data.activity_set_name || COURSE_TAG,
  };
}

function courseUrl(course) {
  const params = new URLSearchParams({
    courseId: state.pageContext.courseId,
    tag: state.pageContext.tag,
    channelId: "",
    libraryId: state.pageContext.libraryId,
    breadcrumb: state.pageContext.tag,
    resourceId: course.id,
  });
  return `${COURSE_PAGE}?${params.toString()}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderCourseList() {
  elements.visibleCount.textContent = state.filteredCourses.length;
  if (!state.filteredCourses.length) {
    elements.courseList.innerHTML = '<div class="no-results">没有匹配的课程</div>';
    return;
  }
  elements.courseList.innerHTML = state.filteredCourses.map((course) => {
    const index = state.courses.findIndex((item) => item.id === course.id) + 1;
    const isOpen = state.selectedIds.includes(course.id);
    return `<button class="course-item${isOpen ? " is-open" : ""}" data-course-id="${course.id}" type="button" title="${escapeHtml(course.title)}">
      <span class="course-number">${String(index).padStart(2, "0")}</span>
      <span class="course-item-title">${escapeHtml(course.title)}</span>
      <span class="course-item-time">${Math.ceil(course.duration / 60)}′</span>
    </button>`;
  }).join("");
}

function renderWorkspace() {
  const standardLayout = [1, 4, 8].includes(state.layout);
  elements.workspaceGrid.className = `workspace-grid grid-${state.layout}${standardLayout ? "" : " grid-custom"}`;
  if (!state.selectedIds.length) {
    elements.workspaceGrid.innerHTML = '<div class="empty-workspace"><div class="empty-icon">＋</div><strong>选择课程开始</strong><span>课程页会在这里并行打开</span></div>';
    elements.activeTag.textContent = "未选择课程";
    return;
  }
  const selectedCourses = state.selectedIds.map((id) => state.courses.find((course) => course.id === id)).filter(Boolean);
  elements.activeTag.textContent = `${selectedCourses.length} 个窗口运行中`;
  elements.workspaceGrid.innerHTML = selectedCourses.map((course, index) => `<article class="workspace-card is-loading">
    <iframe src="${courseUrl(course)}" title="${escapeHtml(course.title)}" loading="lazy" allow="fullscreen; autoplay" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <div class="workspace-card-header">
      <span class="card-index">${index + 1}</span>
      <strong title="${escapeHtml(course.title)}">${escapeHtml(course.title)}</strong>
      <button class="fullscreen-card" data-fullscreen-id="${course.id}" type="button" aria-label="全屏查看 ${escapeHtml(course.title)}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5" /></svg>
        <span>全屏</span>
      </button>
      <button class="close-card" data-close-id="${course.id}" type="button" aria-label="关闭 ${escapeHtml(course.title)}">×</button>
    </div>
  </article>`).join("");
  elements.workspaceGrid.querySelectorAll("iframe").forEach((iframe) => iframe.addEventListener("load", () => iframe.closest(".workspace-card")?.classList.remove("is-loading"), { once: true }));
}

function selectCourse(courseId) {
  const selectedIndex = state.selectedIds.indexOf(courseId);
  if (selectedIndex >= 0) {
    state.selectedIds.splice(selectedIndex, 1);
    showToast("已关闭课程窗口");
  } else if (state.selectedIds.length >= state.layout) {
    state.selectedIds.shift();
    state.selectedIds.push(courseId);
    showToast(`已替换为 ${state.layout} 开布局中的最新课程`);
  } else {
    state.selectedIds.push(courseId);
  }
  renderCourseList();
  renderWorkspace();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function syncFullscreenState() {
  const fullscreenCard = document.fullscreenElement;
  document.querySelectorAll(".workspace-card").forEach((card) => {
    const isFullscreen = card === fullscreenCard;
    card.classList.toggle("is-fullscreen", isFullscreen);
    const button = card.querySelector(".fullscreen-card");
    if (!button) return;
    button.querySelector("span").textContent = isFullscreen ? "退出" : "全屏";
    button.setAttribute("aria-label", isFullscreen ? "退出全屏" : "全屏查看课程");
  });
}

async function toggleFullscreen(card) {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await card.requestFullscreen();
  } catch (error) {
    showToast("当前浏览器不支持窗口全屏");
    console.error(error);
  }
}

function setLayout(layout) {
  state.layout = Math.max(1, Math.min(20, Number(layout)));
  syncLayoutControls();
  if (state.selectedIds.length > state.layout) {
    state.selectedIds = state.selectedIds.slice(-state.layout);
    showToast(`已保留最后 ${state.layout} 个课程窗口`);
  }
  renderCourseList();
  renderWorkspace();
}

function syncLayoutControls() {
  document.querySelectorAll(".layout-button").forEach((button) => button.classList.toggle("active", Number(button.dataset.layout) === state.layout));
  elements.customLayout.classList.toggle("is-active", ![1, 4, 8].includes(state.layout));
  elements.customLayoutInput.value = state.layout;
  elements.parallelLimit.textContent = state.layout;
}

function applyCustomLayout() {
  const requestedLayout = Number(elements.customLayoutInput.value);
  if (!Number.isInteger(requestedLayout) || requestedLayout < 1 || requestedLayout > 20) {
    showToast("请输入 1 到 20 之间的整数");
    return;
  }
  setLayout(requestedLayout);
  showToast(`已设置为同时打开 ${requestedLayout} 个窗口`);
}

async function loadCourses() {
  try {
    const response = await fetch(`${COURSE_FILE}?updated=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.pageContext = pageContextFromData(data);
    state.courses = flattenActivities(data.nodes);
    state.selectedIds = state.selectedIds.filter((id) => state.courses.some((course) => course.id === id));
    const query = elements.courseSearch.value.trim().toLowerCase();
    state.filteredCourses = state.courses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(query));
    const totalDuration = state.courses.reduce((total, course) => total + course.duration, 0);
    elements.courseSetName.textContent = data.activity_set_name || "教师研修课程";
    elements.courseSetMeta.textContent = `${state.courses.length} 节课程 · ${formatDuration(totalDuration)} 学习内容`;
    elements.totalCourses.textContent = state.courses.length;
    elements.totalHours.textContent = formatCompactHours(totalDuration);
    renderCourseList();
    renderWorkspace();
    return true;
  } catch (error) {
    elements.courseSetName.textContent = "课程读取失败";
    elements.courseSetMeta.textContent = "请通过本地 HTTP 服务打开页面";
    elements.courseList.innerHTML = '<div class="no-results">无法读取 course.json</div>';
    showToast("读取 course.json 失败");
    console.error(error);
    return false;
  }
}

elements.courseSearch.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  state.filteredCourses = state.courses.filter((course) => `${course.title} ${course.category}`.toLowerCase().includes(query));
  renderCourseList();
});

elements.refreshCourses.addEventListener("click", async () => {
  elements.refreshCourses.disabled = true;
  elements.refreshCourses.classList.add("is-loading");
  const loaded = await loadCourses();
  elements.refreshCourses.disabled = false;
  elements.refreshCourses.classList.remove("is-loading");
  if (loaded) showToast(`课程清单已更新，共 ${state.courses.length} 节课程`);
});

elements.courseList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-course-id]");
  if (item) selectCourse(item.dataset.courseId);
});

elements.workspaceGrid.addEventListener("click", (event) => {
  const fullscreenButton = event.target.closest("[data-fullscreen-id]");
  if (fullscreenButton) {
    toggleFullscreen(fullscreenButton.closest(".workspace-card"));
    return;
  }
  const closeButton = event.target.closest("[data-close-id]");
  if (closeButton) selectCourse(closeButton.dataset.closeId);
});

document.addEventListener("fullscreenchange", syncFullscreenState);

document.querySelectorAll(".layout-button").forEach((button) => button.addEventListener("click", () => setLayout(button.dataset.layout)));
elements.applyCustomLayout.addEventListener("click", applyCustomLayout);
elements.customLayoutInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyCustomLayout();
});
elements.clearButton.addEventListener("click", () => {
  state.selectedIds = [];
  renderCourseList();
  renderWorkspace();
  showToast("窗口已清空");
});
elements.openAllButton.addEventListener("click", () => {
  if (!state.courses.length) return;
  window.open(courseUrl(state.courses[0]), "_blank", "noopener");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== elements.courseSearch) {
    event.preventDefault();
    elements.courseSearch.focus();
  }
});

syncLayoutControls();
loadCourses();
