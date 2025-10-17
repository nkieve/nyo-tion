
const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const linkbin = document.getElementById("linkbin");
const MAX_OPEN_EDITORS = 2;
  
let noteContainer = document.querySelector(".note-container");
if (!noteContainer) {
    noteContainer = document.createElement("div");
    noteContainer.className = "note-container";
    document.body.appendChild(noteContainer);
}
function saveLinks(links) {
    if (!linkbin) return;
    const lines = links.split("\n").map(line => line.trim()).filter(line => line);
    lines.filter(Boolean); 
    localStorage.setItem("links", JSON.stringify(lines));
}
function getLinks() {
    return JSON.parse(localStorage.getItem("links") || "[]");       
}
function renderLinks() {
    if (!linkbin) return;
    const links = getLinks();
    linkbin.value = links.join("\n");
}

function getTasks() {
    return JSON.parse(localStorage.getItem("tasks") || "[]");
}

function saveTasks(tasks) {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    
}
function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = "";
    const tasks = getTasks();
    tasks.forEach((task, index) => {
        const taskItem = document.createElement("li");
        taskItem.className = "taskItem";

        const taskText = document.createElement("span");
        taskText.className = "taskText";
        taskText.textContent = task && task.text ? task.text : String(task);

        // attach listener to DOM node, not the data object
        taskText.addEventListener("click", () => openNoteEditor(index));
        taskItem.appendChild(taskText);

        const openNoteButton = document.createElement("button");
        openNoteButton.insertAdjacentHTML("afterbegin", "<img src='./edit.svg' alt='' class='icon' width='20' height='20'>");
        openNoteButton.textContent = "Edit Note";
        openNoteButton.className = "EditNoteBtn";
        openNoteButton.addEventListener("click", () => { 
            console.log("Edit click for index", index);
            openNoteEditor(index);
        });
        taskItem.appendChild(openNoteButton);

        const deleteButton = document.createElement("button");
        deleteButton.insertAdjacentHTML("afterbegin", "<img src='./bin.svg' alt='' class='icon' width='20' height='20'>");
        deleteButton.textContent = "";
        deleteButton.className = "DeleteTaskBtn";
        deleteButton.addEventListener("click", () => deleteTask(index));
        taskItem.appendChild(deleteButton);

        taskList.appendChild(taskItem);
    });
}

function addTask() {
    if (!taskInput) return;
    const text = taskInput.value.trim();
    if (!text) return;
    const tasks = getTasks();
    tasks.push({ text, content: "", completed: false });
    saveTasks(tasks);
    taskInput.value = "";
    taskInput.focus();
    renderTasks();
}

function deleteTask(index) {
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    const openPanel = document.getElementById(`doc-${index}`);
    if (openPanel) noteContainer.removeChild(openPanel);
    renderTasks();
}
 
function clearallTasks() {
    const tasks = getTasks();
    if (tasks.length === 0) return;
    
    if (confirm("Are you sure you want to delete all tasks? nyo...")) {
        localStorage.removeItem("tasks");
        if (noteContainer) noteContainer.innerHTML = "";
        renderTasks();
    }
}
function countOpenEditors() {
    if (!noteContainer) return 0;
    return noteContainer.querySelectorAll("section[id^='doc-']").length;
}
function ensureLimitAlertStyles() {
    if (document.getElementById("note-limit-styles")) return;
    const s = document.createElement("style");
    s.id = "note-limit-styles";
    s.textContent = `
    @keyframes note-limit-pop {
        0% { transform: translateY(-10px) scale(.98); opacity: 0 }
        50% { transform: translateY(0) scale(1.03); opacity: 1 }
        100% { transform: translateY(-6px) scale(1); opacity: 0 }
    }
    .note-limit-alert {
        position: fixed;
        left: 50%;
        top: 40%;
        transform: translateX(-50%);
        background: rgba(99,42,5,0.96);
        color: #fff;
        padding: 14px 20px;
        border-radius: 12px;
        font-family: 'Comic Sans MS', cursive, sans-serif;
        font-size: 16px;
        z-index: 9999;
        box-shadow: 0 14px 30px rgba(0,0,0,0.35);
        pointer-events: none;
        opacity: 0;
        will-change: transform, opacity;
    }
    .note-limit-alert.show {
        animation: note-limit-pop 900ms ease-in-out forwards;
    }`;
    document.head.appendChild(s);
}
function showLimitAlert(message = "Maximum open notes reached") {
    ensureLimitAlertStyles();

    let el = document.getElementById("note-limit-alert");
    if (el) {
        el.classList.remove("show");
    
        void el.offsetWidth;
        el.textContent = message;
        el.classList.add("show");
        return;
    }
    el = document.createElement("div");
    el.id = "note-limit-alert";
    el.className = "note-limit-alert show";
    el.textContent = message;
    document.body.appendChild(el);
 
    setTimeout(() => {
        if (!el) return;
        el.classList.remove("show");
        setTimeout(() => el && el.remove(), 300);
    }, 1200);
}
function openNoteEditor(index) {
    const tasks = getTasks();
    if (!tasks[index]) return;

    const existingPanel = document.getElementById(`doc-${index}`);
    if (existingPanel) {
        existingPanel.scrollIntoView({ behavior: "smooth" });
        existingPanel.style.display = "block";
        return;
    }

    const openCount = countOpenEditors();

    
    if (openCount >= MAX_OPEN_EDITORS) {
        showLimitAlert(`You can only open up to ${MAX_OPEN_EDITORS} notes at once.`);
        return;
    }

    
    const notePanel = document.createElement("section");
    notePanel.id = `doc-${index}`;
    notePanel.className = "notePanel";
    noteContainer.appendChild(notePanel);
    notePanel.scrollIntoView({ behavior: "smooth" });

    const header = document.createElement("div");
    header.className = "note-header";

    const titleInput = document.createElement("input");
    titleInput.className = "note-title";
    titleInput.value = tasks[index].text || "";

    const headerButtons = document.createElement("div");
    headerButtons.className = "note-header-buttons";

    const saveButton = document.createElement("button");
    saveButton.className = "saveNoteBtn";
    saveButton.textContent = "Save";

    const closeButton = document.createElement("button");
    closeButton.className = "closeNoteBtn";
    closeButton.textContent = "Close";

    headerButtons.append(saveButton, closeButton);
    header.append(titleInput, headerButtons);

    const bodyDiv = document.createElement("div");
    bodyDiv.className = "doc-body";
    bodyDiv.contentEditable = "true";
    bodyDiv.textContent = tasks[index].content || "";
    bodyDiv.setAttribute("data-placeholder", "Write something nyo...");

    notePanel.append(header, bodyDiv);
    titleInput.focus();

    saveButton.addEventListener("click", () => {
        const t = getTasks();
        t[index].text = titleInput.value.trim() || t[index].text;
        t[index].content = bodyDiv.textContent || "";
        saveTasks(t);
        renderTasks();
    });

    closeButton.addEventListener("click", () => {
        notePanel.remove();
    });
}
if (linkbin) {
    linkbin.addEventListener("input", () => {
        saveLinks(linkbin.value);
    });
}   

if (addTaskButton) addTaskButton.addEventListener("click", addTask);
if (taskInput) {
    taskInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTask();
        }
    });
}

const clearAllButton = document.getElementById("clearAllButton");
if (clearAllButton) clearAllButton.addEventListener("click", clearallTasks);



renderTasks();
renderLinks();