(function () {
  SiteCore.initCountdown({
    daysParty: document.getElementById("days-party"),
    daysRsvp: document.getElementById("days-rsvp"),
    countdown: document.getElementById("countdown"),
  });

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatDue(task) {
    if (task.days_left == null) return "";
    if (task.days_left < 0) return Math.abs(task.days_left) + "d overdue";
    if (task.days_left === 0) return "Due today";
    return task.days_left + "d left";
  }

  function showModeBanner(data) {
    var el = document.getElementById("mode-banner");
    if (!el) return;
    if (data._offline) {
      el.className = "mode-banner offline";
      el.textContent = "Site-only mode — local changes active. Export from Manage when ready to sync to Excel.";
      el.hidden = false;
    } else if (SiteCore.cfg().dataMode === "site-first") {
      el.className = "mode-banner site-first";
      el.textContent = "Running from published site data (Excel). Google Sheet is optional backup.";
      el.hidden = false;
    }
  }

  function renderStats(data) {
    setText("open-tasks", data.tasks.open);
    setText("progress-pct", data.tasks.progress_pct + "%");
    setText("guest-headcount", data.guests.headcount);
    setText("guest-target", data.guests.target);
    setText("rsvp-pending", data.guests.pending);
    var bar = document.getElementById("progress-bar");
    if (bar) bar.style.width = data.tasks.progress_pct + "%";
    var updated = document.getElementById("data-updated");
    if (updated && data.updated_at) {
      updated.textContent = "Tracker synced " + new Date(data.updated_at).toLocaleString();
    }
  }

  function renderUpcoming(data) {
    var list = document.getElementById("upcoming-tasks");
    if (!list) return;
    list.innerHTML = "";
    (data.tasks.upcoming || []).forEach(function (task) {
      var li = document.createElement("li");
      li.className = "task-item " + SiteCore.statusClass(task.status);
      li.innerHTML =
        '<div class="task-main"><span class="task-priority">' + (task.priority || "") + "</span>" +
        "<strong>" + task.task + "</strong>" +
        '<span class="task-meta">' + (task.owner || "") + " · " + formatDue(task) + "</span></div>" +
        '<span class="task-status">' + task.status + "</span>";
      list.appendChild(li);
    });
  }

  function renderAgenda(data) {
    var list = document.getElementById("agenda-list");
    if (!list) return;
    list.innerHTML = "";
    (data.agenda || []).forEach(function (item) {
      if (!item.what) return;
      var li = document.createElement("li");
      li.className = "agenda-item";
      li.innerHTML = "<time>" + item.time + "</time><div><strong>" + item.what + "</strong>" +
        '<span class="muted">' + (item.owner || "") + "</span></div>";
      list.appendChild(li);
    });
  }

  function renderRunSheet(data) {
    var list = document.getElementById("run-sheet-list");
    if (!list) return;
    list.innerHTML = "";
    (data.run_sheet || []).forEach(function (item) {
      var li = document.createElement("li");
      li.className = "run-item" + (item.done ? " done" : "");
      li.innerHTML = "<time>" + item.time + "</time><div><strong>" + item.task + "</strong>" +
        '<span class="muted">' + (item.owner || "") + "</span></div>" +
        '<span class="check">' + (item.done ? "✓" : "○") + "</span>";
      list.appendChild(li);
    });
  }

  function renderBudget(data) {
    var el = document.getElementById("budget-summary");
    if (!el || !data.budget) return;
    var b = data.budget;
    el.innerHTML =
      '<div class="budget-row"><span>Paid so far</span><strong>$' +
      Math.round(b.paid_so_far).toLocaleString() + "</strong></div>" +
      '<div class="budget-row"><span>Est. new purchases</span><strong>$' +
      Math.round(b.est_new_spend).toLocaleString() + "</strong></div>";
  }

  SiteCore.loadCrew()
    .then(function (data) {
      showModeBanner(data);
      renderStats(data);
      renderUpcoming(data);
      renderAgenda(data);
      renderRunSheet(data);
      renderBudget(data);
    })
    .catch(function () {
      setText("open-tasks", "—");
      var el = document.getElementById("data-updated");
      if (el) el.textContent = "Could not load tracker data. Check data/planning-crew.json.";
    });
})();