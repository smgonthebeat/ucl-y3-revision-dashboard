const data = window.DASHBOARD_DATA;

if (!data) {
  document.body.innerHTML = `
    <main style="padding: 32px; font-family: sans-serif;">
      <h1>Dashboard data missing</h1>
      <p>Run <code>python3 scripts/build_dashboard.py</code> from the skill folder, then refresh this page.</p>
    </main>
  `;
}

const state = {
  selectedDate: data?.meta?.selectedDate,
  visibleMonth: data?.meta?.selectedDate?.slice(0, 7),
  dashboardMode: "overview",
  executionSupportTab: "support",
  referenceTab: "week",
  selectedTaskIndex: null,
};

const appShell = document.querySelector(".app-shell");
const monthGrid = document.getElementById("month-grid");
const monthLabel = document.getElementById("month-label");
const weekdayRow = document.getElementById("weekday-row");
const workspaceModeHeading = document.getElementById("workspace-mode-heading");
const workspaceModeHint = document.getElementById("workspace-mode-hint");
const workspaceModeNav = document.getElementById("workspace-mode-nav");
const dayTitle = document.getElementById("day-title");
const dayGoalPill = document.getElementById("day-goal-pill");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleValue = document.getElementById("theme-toggle-value");
const dayFocus = document.getElementById("day-focus");
const todayCalloutText = document.getElementById("today-callout-text");
const todayMeta = document.getElementById("today-meta");
const taskList = document.getElementById("task-list");
const revisitList = document.getElementById("revisit-list");
const carryList = document.getElementById("carry-list");
const blockDetailPanel = document.getElementById("block-detail");
const resourceCompletionPanel = document.getElementById("resource-completion-panel");
const heroStats = document.getElementById("hero-stats");
const heroActions = document.getElementById("hero-actions");
const statusCards = document.getElementById("status-cards");
const weekFocusRail = document.getElementById("week-focus-rail");
const calendarLegend = document.getElementById("calendar-legend");
const weekList = document.getElementById("week-list");
const phaseList = document.getElementById("phase-list");
const planningSummary = document.getElementById("planning-summary");
const planningGrid = document.getElementById("planning-grid");
const methodGrid = document.getElementById("method-grid");
const playbookList = document.getElementById("playbook-list");
const progressList = document.getElementById("progress-list");
const statusHeading = document.getElementById("status-heading");
const statusIntro = document.getElementById("status-intro");
const referenceHeading = document.getElementById("reference-heading");
const referenceIntro = document.getElementById("reference-intro");
const executionHeading = document.getElementById("execution-heading");
const executionIntro = document.getElementById("execution-intro");
const referenceTabs = document.getElementById("reference-tabs");
const referenceHint = document.getElementById("reference-hint");

const referenceViews = {
  week: document.getElementById("reference-week"),
  phase: document.getElementById("reference-phase"),
  planning: document.getElementById("reference-planning"),
  methods: document.getElementById("reference-methods"),
  courses: document.getElementById("reference-courses"),
  log: document.getElementById("reference-log"),
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dailyPlans = data?.dailyPlans || {};
const examsByDate = Object.fromEntries((data?.exams || []).map((exam) => [exam.date, exam]));
const referenceTabsConfig = [
  {
    id: "week",
    label: "Week",
    group: "planning",
    hint: "Use this when you want the next 7 days at a glance without opening weekly markdown files.",
  },
  {
    id: "phase",
    label: "Phase",
    group: "planning",
    hint: "Use this when you want the bigger exam-block strategy and current stage priorities.",
  },
  {
    id: "planning",
    label: "Planning state",
    group: "planning",
    hint: "Use this when you want to see which courses are detailed, which are provisional, and what was integrated most recently.",
  },
  {
    id: "methods",
    label: "Study methods",
    group: "reference",
    hint: "Open this when you know what to study but need the right method: retrieval, spacing, worked examples, or timed practice.",
  },
  {
    id: "courses",
    label: "Course playbooks",
    group: "reference",
    hint: "Open this when switching subjects and you want course-specific advice instead of a generic revision rule.",
  },
  {
    id: "log",
    label: "Progress log",
    group: "reference",
    hint: "Open this when reviewing recent check-ins, carry-forward tasks, or why the plan shifted over the last few days.",
  },
];
const dashboardModesConfig = [
  {
    id: "overview",
    label: "Overview",
    hint: "Start here. Use overview for the calendar, today’s timeline, and a compact selected-block workspace.",
  },
  {
    id: "execution",
    label: "Execution",
    hint: "Use this mode when you want the selected block, the full protocol detail, and the tracker beside it.",
  },
  {
    id: "planning",
    label: "Planning",
    hint: "Use planning mode for readiness, phase logic, and sync context. It is not the place to start studying.",
  },
  {
    id: "reference",
    label: "Reference",
    hint: "Open reference mode only when you need methods, course playbooks, or recent logs.",
  },
];
const themeStorageKey = "ucl-y3-dashboard-theme";

function cleanText(value) {
  return String(value ?? "").replace(/`([^`]+)`/g, "$1");
}

function truncateText(value, maxLength = 108) {
  const text = cleanText(value).replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function summarizeFocusItem(value) {
  const text = cleanText(value).replace(/\s+/g, " ").trim();
  const firstSentence = text.split(/(?<=[.!?])\s+/)[0];
  const firstClause = firstSentence.split(/\s+·\s+|;\s+|,\s+(?=[A-Z0-9])/)[0];
  return truncateText(firstClause || text, 118);
}

function summaryText(parts) {
  return parts.filter(Boolean).join(" · ");
}

function getVisibleReferenceTabs() {
  if (state.dashboardMode === "planning") {
    return referenceTabsConfig.filter((tab) => tab.group === "planning");
  }

  if (state.dashboardMode === "reference") {
    return referenceTabsConfig.filter((tab) => tab.group === "reference");
  }

  return [];
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "study";
  document.documentElement.dataset.theme = nextTheme;
  themeToggle.setAttribute("aria-pressed", nextTheme === "dark" ? "true" : "false");
  themeToggleValue.textContent = nextTheme === "dark" ? "Night mode" : "Study mode";
  window.localStorage.setItem(themeStorageKey, nextTheme);
}

function renderWorkspaceModes() {
  if (!workspaceModeNav) {
    return;
  }

  const currentMode = dashboardModesConfig.find((mode) => mode.id === state.dashboardMode) || dashboardModesConfig[0];
  if (workspaceModeHeading) {
    workspaceModeHeading.textContent = currentMode.label;
  }
  if (workspaceModeHint) {
    workspaceModeHint.textContent = currentMode.hint;
  }

  workspaceModeNav.innerHTML = dashboardModesConfig
    .map(
      (mode) => `
        <button
          type="button"
          class="workspace-mode-button ${mode.id === state.dashboardMode ? "is-active" : ""}"
          data-mode="${mode.id}"
          aria-pressed="${mode.id === state.dashboardMode ? "true" : "false"}"
        >
          ${cleanText(mode.label)}
        </button>
      `,
    )
    .join("");
}

function syncModeCopy() {
  const visibleTabs = getVisibleReferenceTabs();
  const activeTab = visibleTabs.find((tab) => tab.id === state.referenceTab) || visibleTabs[0] || null;

  if (appShell) {
    appShell.dataset.dashboardMode = state.dashboardMode;
  }

  if (statusHeading) {
    statusHeading.textContent = "Planning snapshot";
  }
  if (statusIntro) {
    statusIntro.textContent =
      "Check readiness, sync, and the next two weeks here. You do not need this view to start today’s study block.";
  }

  if (referenceHeading) {
    referenceHeading.textContent = state.dashboardMode === "planning" ? "Planning workspace" : "Reference workspace";
  }
  if (referenceIntro) {
    referenceIntro.textContent =
      state.dashboardMode === "planning"
        ? "Use these tabs when you want the week view, phase logic, or course planning coverage without reading long markdown files."
        : "Use these tabs only when you need study methods, course guidance, or recent logs. Keep the main study flow in overview or execution.";
  }
  if (referenceHint) {
    referenceHint.textContent = activeTab ? cleanText(activeTab.hint) : "";
  }

  if (executionHeading) {
    executionHeading.textContent = state.dashboardMode === "overview" ? "Selected block preview" : "Study cockpit";
  }
  if (executionIntro) {
    executionIntro.textContent =
      state.dashboardMode === "overview"
        ? "Scroll once from the overview to see the selected block, what to open first, and what to do now."
        : "Stay here when you want a full-height task rail, the complete protocol in the center, and support tools on the right.";
  }
}

function setDashboardMode(mode) {
  const nextMode = dashboardModesConfig.find((item) => item.id === mode);
  if (!nextMode) {
    return;
  }

  state.dashboardMode = nextMode.id;
  const visibleTabs = getVisibleReferenceTabs();
  if (visibleTabs.length && !visibleTabs.some((tab) => tab.id === state.referenceTab)) {
    state.referenceTab = visibleTabs[0].id;
  }

  renderWorkspaceModes();
  syncModeCopy();
  renderReferenceTabs();
  if (visibleTabs.length) {
    setReferenceTab(state.referenceTab);
  }
}

function initializeTheme() {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  applyTheme(storedTheme || "study");
}

function monthName(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function getMonthBoundaries(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { first, last };
}

function isoDateFromDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function scrollIntoViewIfNeeded(element) {
  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderWeekdays() {
  weekdayRow.innerHTML = weekdays.map((day) => `<div>${day}</div>`).join("");
}

function buildMonthCells(monthKey) {
  const { first, last } = getMonthBoundaries(monthKey);
  const start = new Date(first);
  const startDay = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startDay);
  const end = new Date(last);
  const endDay = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() + (6 - endDay));

  const cells = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    cells.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

function renderCalendar() {
  monthLabel.textContent = monthName(state.visibleMonth);
  const cells = buildMonthCells(state.visibleMonth);
  const [visibleYear, visibleMonthNumber] = state.visibleMonth.split("-").map(Number);

  monthGrid.innerHTML = cells
    .map((dateObj) => {
      const iso = isoDateFromDate(dateObj);
      const plan = dailyPlans[iso];
      const exam = examsByDate[iso];
      const noStudyDay = isNoStudyDay(plan);
      const totalTasks = plan?.totalTasks || 0;
      const completedTasks = plan?.completedTasks || 0;
      const intensity = noStudyDay ? 0 : totalTasks ? Math.max(12, Math.min(100, (totalTasks / 5) * 100)) : 0;
      const isSelected = iso === state.selectedDate;
      const isOutside =
        dateObj.getFullYear() !== visibleYear || dateObj.getMonth() + 1 !== visibleMonthNumber;
      const ariaLabel = exam
        ? `${iso}, ${exam.exam}`
        : noStudyDay
          ? `${iso}, no study day, closed`
          : plan
            ? `${iso}, ${completedTasks} of ${totalTasks} tasks completed`
            : `${iso}, no scheduled tasks`;
      const caption = exam
        ? cleanText(exam.exam.replace(" - ", ": "))
        : noStudyDay
          ? "No study day"
          : plan
            ? `${completedTasks}/${totalTasks} tasks`
            : "No scheduled tasks";

      return `
        <button
          class="month-cell ${isSelected ? "is-selected" : ""} ${isOutside ? "is-outside" : ""} ${exam ? "is-exam" : ""}"
          data-date="${iso}"
          type="button"
          aria-pressed="${isSelected ? "true" : "false"}"
          ${isSelected ? 'aria-current="date"' : ""}
          aria-label="${cleanText(ariaLabel)}"
        >
          <div class="cell-topline">
            <span class="day-number">${dateObj.getDate()}</span>
            ${exam ? '<span class="exam-dot" title="Exam day"></span>' : ""}
          </div>
          <div class="cell-caption">
            ${caption}
          </div>
          <div class="intensity-track">
            <div class="intensity-bar" style="width:${intensity}%"></div>
          </div>
        </button>
      `;
    })
    .join("");
}

function createChip(text) {
  return `<span class="chip">${text}</span>`;
}

function isNoStudyDay(plan) {
  return Boolean(plan?.isNoStudyDay);
}

function percentage(completed, total) {
  if (!total) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

function renderListItems(items) {
  return (items || [])
    .map((item) => `<li>${cleanText(item)}</li>`)
    .join("");
}

function parseMarkdownLink(value) {
  const match = String(value || "").trim().match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (!match) {
    return null;
  }

  return {
    label: cleanText(match[1]),
    path: cleanText(match[2]),
  };
}

function renderSourceItems(items) {
  return (items || [])
    .map((item) => {
      const parsed = parseMarkdownLink(item);
      if (!parsed) {
        return `<li>${cleanText(item)}</li>`;
      }

      return `
        <li class="detail-source-item">
          <span class="detail-source-label">${parsed.label}</span>
          <span class="detail-source-path">${parsed.path}</span>
        </li>
      `;
    })
    .join("");
}

function renderAnchorTags(items) {
  if (!items || !items.length) {
    return "";
  }

  return `
    <div class="detail-anchor-row">
      ${items.map((item) => `<span class="detail-anchor-tag">${cleanText(item)}</span>`).join("")}
    </div>
  `;
}

function renderDetailSection(title, items, className = "") {
  if (!items || !items.length) {
    return "";
  }

  const sectionClass = ["detail-section", className].filter(Boolean).join(" ");

  return `
    <section class="${sectionClass}">
      <h4>${cleanText(title)}</h4>
      <ul class="detail-list">${renderListItems(items)}</ul>
    </section>
  `;
}

function renderPrimerSection(sourceMaterials, sectionAnchors) {
  const hasSources = sourceMaterials && sourceMaterials.length;
  const hasAnchors = sectionAnchors && sectionAnchors.length;
  if (!hasSources && !hasAnchors) {
    return "";
  }

  return `
    <section class="detail-section detail-section--primer">
      <h4>Open first</h4>
      <div class="detail-primer-stack">
        ${
          hasSources
            ? `
              <div class="detail-subsection">
                <small>Source materials</small>
                <ul class="detail-list detail-list--sources">${renderSourceItems(sourceMaterials)}</ul>
              </div>
            `
            : ""
        }
        ${
          hasAnchors
            ? `
              <div class="detail-subsection">
                <small>Section anchors</small>
                ${renderAnchorTags(sectionAnchors)}
              </div>
            `
            : ""
        }
      </div>
    </section>
  `;
}

function getDefaultTaskIndex(tasks) {
  if (!tasks || !tasks.length) {
    return null;
  }

  const detailIndex = tasks.findIndex((task) => task.protocolDetail);
  return detailIndex >= 0 ? detailIndex : 0;
}

function getSelectedTask(plan) {
  if (!plan || isNoStudyDay(plan) || !Array.isArray(plan.tasks) || !plan.tasks.length) {
    return null;
  }

  if (state.selectedTaskIndex == null || state.selectedTaskIndex < 0 || state.selectedTaskIndex >= plan.tasks.length) {
    state.selectedTaskIndex = getDefaultTaskIndex(plan.tasks);
  }

  if (state.selectedTaskIndex == null) {
    return null;
  }

  return plan.tasks[state.selectedTaskIndex] || null;
}

const protocolDetailAliases = {
  "Source materials": ["Source materials", "Open this note file", "Which revision note file to open"],
  "Section anchors": ["Section anchors", "Section anchors / keywords", "Section anchors / keywords to read"],
  "Reading boundary": ["Reading boundary"],
  "Target after reading": ["Target after reading"],
  "Do now": ["Do now", "Exactly which question group or subparts to do now"],
  "If stuck": ["If stuck", "What to do if stuck"],
  "Output to write down": ["Output to write down", "What output to write down"],
  "Success condition": ["Success condition"],
  "Not today": ["Not today", "Explicitly not for today", "What is explicitly not for today"],
};

function getProtocolDetailValues(detail, canonicalKey) {
  const aliases = protocolDetailAliases[canonicalKey] || [canonicalKey];
  for (const alias of aliases) {
    const value = detail?.[alias];
    if (Array.isArray(value) && value.length) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
  }
  return [];
}

function renderBlockDetail(plan, task) {
  if (!blockDetailPanel) {
    return;
  }

  if (!plan) {
    blockDetailPanel.innerHTML = `
      <div class="detail-empty">
        No detailed plan exists for this date yet. Choose a planned day or rebuild the weekly markdown source.
      </div>
    `;
    return;
  }

  if (isNoStudyDay(plan)) {
    blockDetailPanel.innerHTML = `
      <div class="detail-empty">
        ${cleanText(plan.closureNote || "This day is intentionally closed and has no active block detail.")}
      </div>
    `;
    return;
  }

  if (!task) {
    blockDetailPanel.innerHTML = `
      <div class="detail-empty">
        Select a timeline block to inspect its protocol detail.
      </div>
    `;
    return;
  }

  if (!task.protocolDetail || !task.protocolDetail.detail) {
    blockDetailPanel.innerHTML = `
      <div class="detail-panel-head">
        <div>
          <p class="panel-kicker">Block detail</p>
          <h3>${cleanText(task.time)} · ${cleanText(task.course)}</h3>
        </div>
        <span class="task-status ${task.completed ? "done" : "pending"}">${task.completed ? "Completed" : "Planned"}</span>
      </div>
      <p class="detail-title">${cleanText(task.task)}</p>
      <div class="detail-empty">
        This block does not have a protocol guide attached yet.
      </div>
    `;
    return;
  }

  const detail = task.protocolDetail.detail;
  const scopeText = cleanText(task.scopeToday || "");
  const residueText = cleanText(task.residue || "");
  const protocolState = cleanText(task.state || "Planned");
  const sourceMaterials = getProtocolDetailValues(detail, "Source materials");
  const sectionAnchors = getProtocolDetailValues(detail, "Section anchors");
  const readingBoundary = getProtocolDetailValues(detail, "Reading boundary");
  const targetAfterReading = getProtocolDetailValues(detail, "Target after reading");
  const doNow = getProtocolDetailValues(detail, "Do now");
  const ifStuck = getProtocolDetailValues(detail, "If stuck");
  const outputToWriteDown = getProtocolDetailValues(detail, "Output to write down");
  const successCondition = getProtocolDetailValues(detail, "Success condition");
  const notToday = getProtocolDetailValues(detail, "Not today");

  blockDetailPanel.innerHTML = `
    <div class="detail-panel-head">
      <div>
        <p class="panel-kicker">Block detail</p>
        <h3>${cleanText(task.time)} · ${cleanText(task.course)}</h3>
      </div>
      <span class="task-status ${task.completed ? "done" : "pending"}">${task.completed ? "Completed" : "Planned"}</span>
    </div>
    <p class="detail-title">${cleanText(task.task)}</p>
    <div class="detail-chip-row">
      <span class="chip">${cleanText(task.protocolDetail.protocolId)}</span>
      ${scopeText ? `<span class="chip">Live scope: ${scopeText}</span>` : ""}
      ${residueText ? `<span class="chip">Residue: ${residueText}</span>` : ""}
      <span class="chip">State: ${protocolState}</span>
    </div>
    <div class="detail-grid">
      ${renderPrimerSection(sourceMaterials, sectionAnchors)}
      ${renderDetailSection("Reading boundary", readingBoundary, "detail-section--compact")}
      ${renderDetailSection("Target after reading", targetAfterReading, "detail-section--compact")}
      ${renderDetailSection("Do now", doNow, "detail-section--priority")}
      ${renderDetailSection("If stuck", ifStuck)}
      ${renderDetailSection("Output to write down", outputToWriteDown)}
      ${renderDetailSection("Success condition", successCondition, "detail-section--success")}
      ${renderDetailSection("Not today", notToday, "detail-section--caution")}
    </div>
  `;
}

function renderTrackerPanel(selectedProtocolId) {
  const resourceCompletion = data.resourceCompletion || {};
  const rows = resourceCompletion.rows || [];
  const groupedRows = Object.entries(resourceCompletion.byCourse || {});
  const courseEntries =
    groupedRows.length > 0
      ? groupedRows
      : rows.reduce((acc, row) => {
          const bucket = acc[row.course] || [];
          bucket.push(row);
          acc[row.course] = bucket;
          return acc;
        }, {});
  const normalizedCourseEntries = groupedRows.length > 0 ? groupedRows : Object.entries(courseEntries);
  const selectedRow = selectedProtocolId ? resourceCompletion.byProtocolId?.[selectedProtocolId] : null;
  const trackedRows = rows.length;
  const activeRows = rows.filter((row) => row.state === "in progress").length;
  const protectedRows = rows.filter((row) => row.protected).length;

  return `
    <div class="resource-summary">
      <div class="meta-card">
        <small>Tracked rows</small>
        <strong>${trackedRows}</strong>
      </div>
      <div class="meta-card">
        <small>Live rows</small>
        <strong>${activeRows}</strong>
      </div>
      <div class="meta-card">
        <small>Protected</small>
        <strong>${protectedRows}</strong>
      </div>
    </div>
    ${
      selectedRow
        ? `
          <div class="resource-highlight">
            <strong>${cleanText(selectedRow.protocolId)}</strong>
            <p>${cleanText(selectedRow.currentLiveScope || selectedRow.remainingScope || "Selected block is tracked in the resource ledger.")}</p>
          </div>
        `
        : ""
    }
    ${
      normalizedCourseEntries.length
        ? `
          <div class="resource-course-list">
            ${normalizedCourseEntries
              .map(([course, courseRows]) => {
                return `
                  <article class="resource-course-card">
                    <div class="resource-course-topline">
                      <div>
                        <small>${cleanText(course)}</small>
                        <strong>${courseRows.length} protocol${courseRows.length === 1 ? "" : "s"}</strong>
                      </div>
                    </div>
                    <div class="resource-row-list">
                      ${courseRows
                        .map((row) => {
                          const isSelected = row.protocolId === selectedProtocolId;
                          return `
                            <article class="resource-row ${isSelected ? "is-selected" : ""}">
                              <div class="resource-row-topline">
                                <div>
                                  <strong>${cleanText(row.resourceLine)}</strong>
                                  <small>${cleanText(row.protocolId)}</small>
                                </div>
                                <span class="resource-state">${cleanText(row.state)}</span>
                              </div>
                              <div class="resource-row-meta">
                                <span>Scope: ${cleanText(row.currentLiveScope || "none yet")}</span>
                                <span>Remaining: ${cleanText(row.remainingScope || "none yet")}</span>
                                <span>${row.protected ? "Protected" : "Live"}</span>
                              </div>
                              <p>${cleanText(row.notes || row.completedScope || "Tracked resource row.")}</p>
                              <small>Last touched ${cleanText(row.lastTouchedDate || "unknown")}</small>
                            </article>
                          `;
                        })
                        .join("")}
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>
        `
        : `<div class="detail-empty">No resource completion rows are available yet.</div>`
    }
  `;
}

function renderSupportSection(title, body, className = "") {
  if (!body) {
    return "";
  }

  const sectionClass = ["support-section", className].filter(Boolean).join(" ");
  return `
    <section class="${sectionClass}">
      <small>${cleanText(title)}</small>
      ${body}
    </section>
  `;
}

function renderSupportList(items) {
  if (!items || !items.length) {
    return `<p class="support-copy">None right now.</p>`;
  }

  return `<ul class="support-list">${items.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>`;
}

function renderSessionSupport(plan, task) {
  if (!plan || !task) {
    return `<div class="detail-empty">Select a timeline block to open session support.</div>`;
  }

  const selectedProtocolId = task.protocolId || task.protocolDetail?.protocolId || null;
  const selectedRow = selectedProtocolId ? data.resourceCompletion?.byProtocolId?.[selectedProtocolId] : null;
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  const taskIndex = tasks.findIndex(
    (candidate) => candidate.time === task.time && candidate.course === task.course && candidate.task === task.task,
  );
  const nextTask = taskIndex >= 0 ? tasks.slice(taskIndex + 1).find((candidate) => !candidate.completed) || tasks[taskIndex + 1] : null;

  return `
    ${renderSupportSection(
      "Current block",
      `
        <strong class="support-title">${cleanText(task.course)} · ${cleanText(task.time)}</strong>
        <p class="support-copy">${cleanText(task.notes || task.task)}</p>
      `,
      "support-section--highlight",
    )}
    ${renderSupportSection(
      "What matters after this block",
      nextTask
        ? `
            <strong class="support-title">${cleanText(nextTask.time)} · ${cleanText(nextTask.course)}</strong>
            <p class="support-copy">${cleanText(nextTask.task)}</p>
          `
        : `<p class="support-copy">No later block is scheduled after this one today. Close the day with revisit and carry-forward review.</p>`,
    )}
    ${selectedRow
      ? renderSupportSection(
          "Tracked residue",
          `
            <strong class="support-title">${cleanText(selectedRow.resourceLine)}</strong>
            <p class="support-copy">${cleanText(selectedRow.remainingScope || selectedRow.currentLiveScope || "No remaining scope recorded.")}</p>
          `,
        )
      : ""}
    ${renderSupportSection("Revisit queue", renderSupportList((plan.revisitQueue || []).slice(0, 3)))}
    ${renderSupportSection("Carry forward", renderSupportList((data.status.carryForward || []).slice(0, 3)))}
  `;
}

function renderExecutionSupport(plan, task) {
  if (!resourceCompletionPanel) {
    return;
  }

  const currentTab = state.executionSupportTab === "tracker" ? "tracker" : "support";
  const selectedProtocolId = task?.protocolId || null;
  resourceCompletionPanel.innerHTML = `
    <div class="detail-panel-head">
      <div>
        <p class="panel-kicker">Support rail</p>
        <h3>${currentTab === "tracker" ? "Protocol tracker" : "Session support"}</h3>
      </div>
      <span class="pill">${currentTab === "tracker" ? "Tracker" : "Focused"}</span>
    </div>
    <div class="support-tab-row" role="tablist" aria-label="Execution support tabs">
      <button
        type="button"
        class="support-tab-button ${currentTab === "support" ? "is-active" : ""}"
        data-support-tab="support"
        aria-pressed="${currentTab === "support" ? "true" : "false"}"
      >
        Session support
      </button>
      <button
        type="button"
        class="support-tab-button ${currentTab === "tracker" ? "is-active" : ""}"
        data-support-tab="tracker"
        aria-pressed="${currentTab === "tracker" ? "true" : "false"}"
      >
        Tracker
      </button>
    </div>
    <div class="support-tab-body">
      ${currentTab === "tracker" ? renderTrackerPanel(selectedProtocolId) : renderSessionSupport(plan, task)}
    </div>
  `;
}

function renderCalendarLegend() {
  calendarLegend.innerHTML = `
    <span class="legend-chip"><span class="legend-dot"></span> Exam day</span>
    <span class="legend-chip"><span class="legend-bar"></span> Study load intensity</span>
    <span class="legend-chip">Click a date to open that day's plan</span>
  `;
}

function getTodayCallout(plan) {
  if (!plan) {
    return "No structured day plan exists yet. Rebuild the weekly plan markdown, then refresh this page.";
  }

  if (isNoStudyDay(plan)) {
    return "No study was done on this date. The day is explicitly closed and removed from the live study timeline.";
  }

  const pendingTask = plan.tasks.find((task) => !task.completed) || plan.tasks[0];
  if (!pendingTask) {
    return "This day has no scheduled study blocks. Use the reference workspace to adjust the next few days.";
  }

  if (plan.completedTasks === plan.totalTasks) {
    return "Today's planned blocks are complete. Use the revisit queue and carry-forward review before closing the day.";
  }

  return `Start with ${cleanText(pendingTask.time)} · ${cleanText(pendingTask.course)}. ${cleanText(pendingTask.task)}`;
}

function renderDay() {
  const plan = dailyPlans[state.selectedDate];
  if (!plan) {
    dayTitle.textContent = state.selectedDate;
    dayGoalPill.textContent = "No plan yet";
    todayCalloutText.textContent =
      "This date has no detailed plan yet. Use the calendar to move to a planned day or rebuild the weekly markdown source.";
    dayFocus.innerHTML = "";
    todayMeta.innerHTML = "";
    taskList.innerHTML = `<div class="empty-state">No detailed plan exists for this date yet. Add or rebuild the relevant weekly markdown plan, then refresh.</div>`;
    revisitList.innerHTML = `<div class="empty-state">No revisit items.</div>`;
    carryList.innerHTML = `<div class="empty-state">No carry-forward items.</div>`;
    state.selectedTaskIndex = null;
    renderBlockDetail(null, null);
    renderExecutionSupport(null, null);
    return;
  }

  dayTitle.textContent = `${plan.date} · ${plan.weekday}`;
  dayGoalPill.textContent = cleanText(plan.dailyGoal || "Daily goal");
  todayCalloutText.textContent = getTodayCallout(plan);
  dayFocus.innerHTML = (plan.focus || []).map((item) => createChip(cleanText(item))).join("");

  if (isNoStudyDay(plan)) {
    todayMeta.innerHTML = `
      <div class="meta-card">
        <small>Study blocks</small>
        <strong>0</strong>
      </div>
      <div class="meta-card">
        <small>Status</small>
        <strong>Closed day</strong>
      </div>
      <div class="meta-card">
        <small>Timeline role</small>
        <strong>Not active</strong>
      </div>
    `;
    taskList.innerHTML = `<div class="empty-state">${cleanText(plan.closureNote || "No study was done on this day. It is intentionally closed and excluded from the live task timeline.")}</div>`;
    revisitList.innerHTML = `<div class="empty-state">No revisit queue. The real study timeline starts from the next active day.</div>`;
    const carryItems = data.status.carryForward || [];
    carryList.innerHTML = carryItems.length
      ? carryItems.map((item) => `<div class="stack-item">${cleanText(item)}</div>`).join("")
      : `<div class="empty-state">No live carry-forward items right now.</div>`;
    state.selectedTaskIndex = null;
    renderBlockDetail(plan, null);
    renderExecutionSupport(plan, null);
    return;
  }

  todayMeta.innerHTML = `
    <div class="meta-card">
      <small>Planned blocks</small>
      <strong>${plan.totalTasks}</strong>
    </div>
    <div class="meta-card">
      <small>Completed</small>
      <strong>${plan.completedTasks}</strong>
    </div>
    <div class="meta-card">
      <small>Completion rate</small>
      <strong>${percentage(plan.completedTasks, plan.totalTasks)}%</strong>
    </div>
  `;

  const selectedTask = getSelectedTask(plan);
  taskList.innerHTML = plan.tasks
    .map((task, index) => {
      const statusClass = task.completed ? "done" : "pending";
      const statusLabel = task.completed ? "Completed" : "Planned";
      return `
        <button
          class="task-card ${selectedTask && state.selectedTaskIndex === index ? "is-selected" : ""}"
          type="button"
          data-task-index="${index}"
          aria-pressed="${selectedTask && state.selectedTaskIndex === index ? "true" : "false"}"
        >
          <div class="task-topline">
            <div>
              <div class="task-time">${cleanText(task.time)}</div>
              <div class="task-course">${cleanText(task.course)}</div>
            </div>
            <span class="task-status ${statusClass}">${statusLabel}</span>
          </div>
          <p class="task-title">${cleanText(task.task)}</p>
          <div class="task-meta">
            <span>${cleanText(task.type)}</span>
            <span>Method: ${cleanText(task.method)}</span>
            <span>${task.carry ? "Can carry forward" : "Fixed to today"}</span>
          </div>
          <p class="task-title" style="margin-top:10px; color: var(--muted); font-size:0.92rem;">${cleanText(task.notes)}</p>
        </button>
      `;
    })
    .join("");

  revisitList.innerHTML = (plan.revisitQueue || []).length
    ? plan.revisitQueue.map((item) => `<div class="stack-item">${cleanText(item)}</div>`).join("")
    : `<div class="empty-state">No revisit queue for this day.</div>`;

  const carryItems = data.status.carryForward || [];
  carryList.innerHTML = carryItems.length
    ? carryItems.map((item) => `<div class="stack-item">${cleanText(item)}</div>`).join("")
    : `<div class="empty-state">No live carry-forward items right now.</div>`;

  renderBlockDetail(plan, selectedTask);
  renderExecutionSupport(plan, selectedTask);
}

function renderHeroStats() {
  const nextExam = data.status.nextExam;
  const recentStats = data.status.recentStats;
  heroStats.innerHTML = `
    <div class="stat-card stat-card--wide">
      <small>Current planning date</small>
      <strong>${data.meta.currentPlanningDate}</strong>
    </div>
    <div class="stat-card stat-card--soft">
      <small>Next exam</small>
      <strong>${nextExam ? cleanText(nextExam.exam.split(" - ")[0]) : "None"}</strong>
    </div>
    <div class="stat-card stat-card--soft">
      <small>Days until next exam</small>
      <strong>${nextExam ? nextExam.daysUntil : "—"}</strong>
    </div>
    <div class="stat-card stat-card--soft">
      <small>7-day completion rate</small>
      <strong>${recentStats.completionRate}%</strong>
    </div>
    <div class="stat-card stat-card--soft">
      <small>Carry forward</small>
      <strong>${(data.status.carryForward || []).filter((item) => cleanText(item) !== "None").length}</strong>
    </div>
  `;
}

function renderHeroActions() {
  const nextExam = data.status.nextExam;
  const actions = [
    {
      id: "jump-today",
      label: "Open today",
      detail: "Go back to the current planning date",
    },
    {
      id: "jump-next-exam",
      label: nextExam ? `Open ${cleanText(nextExam.exam.split(" - ")[0])}` : "Next exam",
      detail: nextExam ? `${nextExam.date}` : "No upcoming exam",
    },
    {
      id: "open-methods",
      label: "Study methods",
      detail: "Open the reference method tab",
    },
    {
      id: "open-planning",
      label: "Planning state",
      detail: "Open the course readiness tab",
    },
  ];

  heroActions.innerHTML = actions
    .map(
      (action) => `
        <button class="hero-action" type="button" data-action="${action.id}">
          <span>${cleanText(action.label)}</span>
          <small>${cleanText(action.detail)}</small>
        </button>
      `,
    )
    .join("");
}

function renderStatusCards() {
  const nextExam = data.status.nextExam;
  const planningSummaryData = data.planningState?.summary || {};
  const syncState = data.planningState?.syncState || {};
  const compactFocus = (data.status.weekFocus || []).slice(0, 4).map(summarizeFocusItem);
  const cards = [
    {
      label: "Next exam",
      value: nextExam ? `${nextExam.date}` : "None",
      detail: nextExam ? cleanText(nextExam.exam.split(" - ")[0]) : "No upcoming exam",
    },
    {
      label: "Priority order",
      value: data.status.priorityOrder.slice(0, 3).map(cleanText).join(" → "),
      detail: "Top three priorities",
    },
    {
      label: "Planning coverage",
      value: `${planningSummaryData.detailedCount || 0} detailed / ${planningSummaryData.provisionalCount || 0} provisional`,
      detail: planningSummaryData.latestBlueprintCourse
        ? summaryText([
            `Latest blueprint ${cleanText(planningSummaryData.latestBlueprintCourse)}`,
            cleanText(planningSummaryData.latestBlueprintUpdatedAt || ""),
          ])
        : "No blueprint integration recorded yet",
    },
    {
      label: "Blueprint sync",
      value: cleanText(syncState.pendingStatus || "none"),
      detail:
        syncState.pendingStatus === "pending" && syncState.pendingCourse
          ? `Pending ${cleanText(syncState.pendingCourse)}`
          : syncState.lastSyncedCourse
            ? summaryText([
                `Last synced ${cleanText(syncState.lastSyncedCourse)}`,
                cleanText(syncState.lastSyncedAt || ""),
              ])
            : "No saved blueprint sync recorded yet",
    },
    {
      label: "Last updated",
      value: data.meta.lastUpdated,
      detail: `Generated ${cleanText(data.meta.generatedAt)}`,
    },
  ];

  weekFocusRail.innerHTML = `
    <article class="focus-summary">
      <small>This week</small>
      <strong>What to pay attention to</strong>
      <ul class="focus-summary-list">
        ${compactFocus.map((item) => `<li>${cleanText(item)}</li>`).join("")}
      </ul>
    </article>
    <article class="focus-summary focus-summary--meta">
      <small>How to use this mode</small>
      <p>Use Planning when you need readiness, phase logic, or sync context. Start actual study from Overview or Execution.</p>
    </article>
  `;

  statusCards.innerHTML = cards
    .map(
      (card) => `
        <article class="status-card">
          <small>${card.label}</small>
          <strong>${card.value}</strong>
          <p class="status-card-note">${cleanText(card.detail)}</p>
        </article>
      `,
    )
    .join("");
}

function renderWeekSummary() {
  const weekSummary = data.weekSummary || { days: [] };
  weekList.innerHTML = (weekSummary.days || [])
    .map((day) => {
      const dailyPlan = dailyPlans[day.date];
      const noStudyDay = isNoStudyDay(dailyPlan);
      const courses = noStudyDay
        ? "Closed no-study day"
        : (day.mainCourses || []).length
          ? day.mainCourses.map(cleanText).join(" · ")
          : "No course focus yet";
      const completion = noStudyDay ? "Closed day" : day.taskCount ? `${day.completedTasks}/${day.taskCount} blocks` : "No blocks scheduled";
      return `
        <article class="week-day-card">
          <div class="week-day-topline">
            <div>
              <small>${cleanText(day.weekday)}</small>
              <strong>${cleanText(day.date)}</strong>
            </div>
            <span class="chip">${completion}</span>
          </div>
          <p class="week-day-goal">${cleanText(day.goal || "No day goal yet.")}</p>
          <p class="week-day-courses">${courses}</p>
        </article>
      `;
    })
    .join("");
}

function renderPhases() {
  phaseList.innerHTML = (data.phases || [])
    .map(
      (phase) => `
        <article class="phase-card">
          <h3>${cleanText(phase.title)}</h3>
          <ul>${phase.items.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>
        </article>
      `,
    )
    .join("");
}

function renderPlanningState() {
  const planningState = data.planningState || { summary: {}, courses: [] };
  const summary = planningState.summary || {};
  const syncState = planningState.syncState || {};
  planningSummary.innerHTML = `
    <article class="status-card">
      <small>Detailed courses</small>
      <strong>${summary.detailedCount || 0}</strong>
      <p class="status-card-note">Provisional: ${summary.provisionalCount || 0} · Not organized: ${summary.notOrganizedCount || 0}</p>
    </article>
    <article class="status-card">
      <small>Latest blueprint</small>
      <strong>${cleanText(summary.latestBlueprintCourse || "None")}</strong>
      <p class="status-card-note">${cleanText(summary.latestBlueprintUpdatedAt || "No updates recorded yet")}</p>
    </article>
    <article class="status-card">
      <small>Sync state</small>
      <strong>${cleanText(syncState.pendingStatus || "none")}</strong>
      <p class="status-card-note">${
        syncState.pendingStatus === "pending" && syncState.pendingCourse
          ? `Pending blueprint: ${cleanText(syncState.pendingCourse)}`
          : syncState.lastSyncedCourse
            ? `Last synced: ${cleanText(syncState.lastSyncedCourse)} · ${cleanText(syncState.lastSyncedAt || "")}`
            : "No pending or synced blueprint recorded yet"
      }</p>
    </article>
  `;

  planningGrid.innerHTML = (planningState.courses || [])
    .map(
      (course) => `
        <article class="planning-card">
          <small>${cleanText(course.course)}</small>
          <strong>${cleanText(course.planningState)}</strong>
          <p><strong>Role:</strong> ${cleanText(course.currentRole || "Unassigned")}</p>
          <p><strong>Weight:</strong> ${cleanText(course.revisionWeight || "Unknown")}</p>
          <p><strong>Updated:</strong> ${cleanText(course.lastUpdated || "Not yet")}</p>
          <p><strong>Constraint:</strong> ${cleanText(course.constraint || "None recorded")}</p>
        </article>
      `,
    )
    .join("");
}

function renderMethods() {
  methodGrid.innerHTML = (data.studyMethods || [])
    .map(
      (method) => `
        <article class="method-card">
          <h3>${cleanText(method.title)}</h3>
          <p class="method-summary">${cleanText(method.summary)}</p>
          ${method.bullets.length ? `<ul>${method.bullets.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderPlaybooks() {
  playbookList.innerHTML = (data.coursePlaybooks || [])
    .map((playbook, index) => {
      const sections = Object.entries(playbook.sections || {})
        .map(([title, content]) => {
          const paragraphs = (content.paragraphs || []).map((paragraph) => `<p>${cleanText(paragraph)}</p>`).join("");
          const items = (content.items || []).length
            ? `<ul>${content.items.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>`
            : "";
          return `
            <div class="playbook-section">
              <h4>${cleanText(title)}</h4>
              ${paragraphs}
              ${items}
            </div>
          `;
        })
        .join("");
      return `
        <details class="playbook" ${index === 0 ? "open" : ""}>
          <summary>${cleanText(playbook.course)}<span>+</span></summary>
          <div class="playbook-content">${sections}</div>
        </details>
      `;
    })
    .join("");
}

function renderProgressEntries() {
  progressList.innerHTML = (data.progressEntries || [])
    .slice()
    .reverse()
    .map((entry) => {
      const completed = entry.data["Completed"] || [];
      const carryForward = entry.data["Carry forward"] || [];
      const completedList = Array.isArray(completed) ? completed : [completed];
      const carryListItems = Array.isArray(carryForward) ? carryForward : [carryForward];
      return `
        <article class="progress-card">
          <h3>${entry.timestamp}</h3>
          <p><strong>Reported date:</strong> ${cleanText(entry.data["Reported date"] || "Unknown")}</p>
          ${completedList.length ? `<ul>${completedList.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>` : ""}
          ${carryListItems.length && carryListItems[0]
            ? `<p><strong>Carry forward:</strong></p><ul>${carryListItems.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>`
            : ""}
        </article>
      `;
    })
    .join("");
}

function renderReferenceTabs() {
  const visibleTabs = getVisibleReferenceTabs();
  referenceTabs.innerHTML = visibleTabs
    .map(
      (tab) => `
        <button
          type="button"
          class="reference-tab ${state.referenceTab === tab.id ? "is-active" : ""}"
          data-tab="${tab.id}"
          aria-pressed="${state.referenceTab === tab.id ? "true" : "false"}"
        >
          ${cleanText(tab.label)}
        </button>
      `,
    )
    .join("");
}

function setReferenceTab(tabId) {
  const visibleTabs = getVisibleReferenceTabs();
  const safeTabId = visibleTabs.some((tab) => tab.id === tabId) ? tabId : visibleTabs[0]?.id;
  if (!safeTabId || !referenceViews[safeTabId]) {
    return;
  }

  state.referenceTab = safeTabId;
  const tabConfig = referenceTabsConfig.find((tab) => tab.id === safeTabId);
  Object.entries(referenceViews).forEach(([id, element]) => {
    if (!element) {
      return;
    }
    element.hidden = id !== safeTabId;
  });
  if (referenceHint && tabConfig) {
    referenceHint.textContent = cleanText(tabConfig.hint);
  }
  renderReferenceTabs();
}

function runWhenIdle(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }

  window.setTimeout(callback, 32);
}

function renderSecondarySections() {
  renderWeekSummary();
  renderPhases();
  renderPlanningState();
  renderMethods();
  renderPlaybooks();
  renderProgressEntries();
  renderReferenceTabs();
  setReferenceTab(state.referenceTab);
}

function shiftMonth(offset) {
  const [year, month] = state.visibleMonth.split("-").map(Number);
  const next = new Date(year, month - 1 + offset, 1);
  state.visibleMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  renderCalendar();
}

function jumpToDate(date, options = {}) {
  if (!date || !dailyPlans[date] && !examsByDate[date]) {
    return;
  }

  state.selectedDate = date;
  state.visibleMonth = date.slice(0, 7);
  state.selectedTaskIndex = null;
  renderCalendar();
  renderDay();

  if (options.scrollToday) {
    scrollIntoViewIfNeeded(document.querySelector(".today-panel"));
  }
}

function attachControls() {
  document.getElementById("prev-month").addEventListener("click", () => shiftMonth(-1));
  document.getElementById("next-month").addEventListener("click", () => shiftMonth(1));
  document.getElementById("jump-today").addEventListener("click", () => {
    jumpToDate(data.meta.currentPlanningDate, { scrollToday: true });
  });

  monthGrid.addEventListener("click", (event) => {
    const cell = event.target.closest(".month-cell");
    if (!cell) {
      return;
    }
    jumpToDate(cell.dataset.date);
  });

  taskList.addEventListener("click", (event) => {
    const taskButton = event.target.closest("[data-task-index]");
    if (!taskButton) {
      return;
    }

    const nextIndex = Number(taskButton.dataset.taskIndex);
    if (Number.isNaN(nextIndex)) {
      return;
    }

    state.selectedTaskIndex = nextIndex;
    renderDay();
  });

  heroActions.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) {
      return;
    }

    const actionName = action.dataset.action;
    if (actionName === "jump-today") {
      setDashboardMode("overview");
      jumpToDate(data.meta.currentPlanningDate, { scrollToday: true });
      return;
    }

    if (actionName === "jump-next-exam" && data.status.nextExam?.date) {
      setDashboardMode("overview");
      jumpToDate(data.status.nextExam.date, { scrollToday: true });
      return;
    }

    if (actionName === "open-methods") {
      setDashboardMode("reference");
      setReferenceTab("methods");
      scrollIntoViewIfNeeded(document.querySelector(".reference-panel"));
      return;
    }

    if (actionName === "open-planning") {
      setDashboardMode("planning");
      setReferenceTab("planning");
      scrollIntoViewIfNeeded(document.querySelector(".reference-panel"));
    }
  });

  resourceCompletionPanel.addEventListener("click", (event) => {
    const tabButton = event.target.closest("[data-support-tab]");
    if (!tabButton) {
      return;
    }

    state.executionSupportTab = tabButton.dataset.supportTab === "tracker" ? "tracker" : "support";
    const plan = dailyPlans[state.selectedDate];
    const selectedTask = getSelectedTask(plan);
    renderExecutionSupport(plan, selectedTask);
  });

  workspaceModeNav.addEventListener("click", (event) => {
    const modeButton = event.target.closest("[data-mode]");
    if (!modeButton) {
      return;
    }
    setDashboardMode(modeButton.dataset.mode);
  });

  referenceTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (!tab) {
      return;
    }
    setReferenceTab(tab.dataset.tab);
  });

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "study";
    applyTheme(currentTheme === "dark" ? "study" : "dark");
  });
}

function init() {
  initializeTheme();
  renderWorkspaceModes();
  syncModeCopy();
  renderWeekdays();
  renderCalendarLegend();
  renderHeroStats();
  renderHeroActions();
  renderStatusCards();
  renderCalendar();
  renderDay();
  attachControls();
  runWhenIdle(renderSecondarySections);
}

if (data) {
  init();
}
