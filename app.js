(function () {
  var party = new Date(2026, 7, 8);
  var rsvp = new Date(2026, 6, 11);
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function daysUntil(d) {
    return Math.round((d - today) / 86400000);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function initCountdown() {
    var dp = daysUntil(party);
    var dr = daysUntil(rsvp);
    setText("days-party", dp > 0 ? dp : dp === 0 ? "Today!" : "Past");
    setText("days-rsvp", dr > 0 ? dr : dr === 0 ? "Today!" : "Passed");
    setText(
      "countdown",
      dp > 0
        ? dp + " days until the party"
        : dp === 0
          ? "Party day!"
          : "Thanks for celebrating with us"
    );
  }

  function statusClass(status) {
    var s = (status || "").toLowerCase();
    if (s === "done") return "status-done";
    if (s.indexOf("progress") >= 0) return "status-progress";
    return "status-open";
  }

  function formatDue(task) {
    if (task.days_left === null || task.days_left === undefined) return "";
    if (task.days_left < 0) return Math.abs(task.days_left) + "d overdue";
    if (task.days_left === 0) return "Due today";
    return task.days_left + "d left";
  }

  function renderStats(data) {
    if (!data) return;
    setText("open-tasks", data.tasks.open);
    setText("progress-pct", data.tasks.progress_pct + "%");
    setText("guest-headcount", data.guests.headcount || data.guests.target);
    setText("guest-target", data.guests.target);
    setText("rsvp-pending", data.guests.pending);

    var bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = data.tasks.progress_pct + "%";

    var updated = document.getElementById("data-updated");
    if (updated && data.updated_at) {
      var d = new Date(data.updated_at);
      updated.textContent = "Tracker synced " + d.toLocaleString();
    }
  }

  function renderUpcoming(data) {
    var list = document.getElementById("upcoming-tasks");
    if (!list || !data) return;
    list.innerHTML = "";
    data.tasks.upcoming.forEach(function (task) {
      var li = document.createElement("li");
      li.className = "task-item " + statusClass(task.status);
      li.innerHTML =
        '<div class="task-main">' +
        '<span class="task-priority">' + (task.priority || "") + "</span>" +
        "<strong>" + task.task + "</strong>" +
        '<span class="task-meta">' + (task.owner || "") + " · " + formatDue(task) + "</span>" +
        "</div>" +
        '<span class="task-status">' + task.status + "</span>";
      list.appendChild(li);
    });
  }

  function renderAgenda(data) {
    var list = document.getElementById("agenda-list");
    if (!list || !data) return;
    list.innerHTML = "";
    data.agenda.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "agenda-item";
      li.innerHTML =
        '<time>' + item.time + "</time>" +
        "<div><strong>" + (item.what || "") + "</strong>" +
        '<span class="muted">' + (item.owner || "") + "</span></div>";
      list.appendChild(li);
    });
  }

  function renderRunSheet(data) {
    var list = document.getElementById("run-sheet-list");
    if (!list || !data) return;
    list.innerHTML = "";
    data.run_sheet.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "run-item" + (item.done ? " done" : "");
      li.innerHTML =
        '<time>' + item.time + "</time>" +
        "<div><strong>" + (item.task || "") + "</strong>" +
        '<span class="muted">' + (item.owner || "") + "</span></div>" +
        '<span class="check">' + (item.done ? "✓" : "○") + "</span>";
      list.appendChild(li);
    });
  }

  function renderBudget(data) {
    var el = document.getElementById("budget-summary");
    if (!el || !data) return;
    var b = data.budget;
    el.innerHTML =
      '<div class="budget-row"><span>Paid so far</span><strong>$' +
      Math.round(b.paid_so_far).toLocaleString() +
      "</strong></div>" +
      '<div class="budget-row"><span>Est. new purchases</span><strong>$' +
      Math.round(b.est_new_spend).toLocaleString() +
      "</strong></div>";
  }

  initCountdown();

  fetch("/data/planning.json")
    .then(function (r) {
      if (!r.ok) throw new Error("no data");
      return r.json();
    })
    .then(function (data) {
      renderStats(data);
      renderUpcoming(data);
      renderAgenda(data);
      renderRunSheet(data);
      renderBudget(data);
    })
    .catch(function () {
      setText("open-tasks", "—");
    });
})();