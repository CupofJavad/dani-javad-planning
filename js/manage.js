(function () {
  var data = null;

  function el(id) { return document.getElementById(id); }

  function ownerSuggestions() {
    var names = {};
    (data.tasks.all || []).forEach(function (t) {
      if (t.owner) names[t.owner] = true;
    });
    return Object.keys(names).sort();
  }

  function renderTasks() {
    var tbody = el("task-table-body");
    if (!tbody || !data) return;
    tbody.innerHTML = "";
    var suggestions = ownerSuggestions();
    (data.tasks.all || []).forEach(function (t) {
      var tr = document.createElement("tr");
      var ownerInput = document.createElement("input");
      ownerInput.type = "text";
      ownerInput.className = "owner-input";
      ownerInput.value = t.owner || "";
      ownerInput.setAttribute("list", "owner-suggestions");
      ownerInput.placeholder = "Assign owner";
      ownerInput.addEventListener("change", function () {
        OfflineStore.setTaskOwner(t.id, ownerInput.value.trim());
        SiteCore.loadCrew().then(function (d) { data = d; renderTasks(); updateStats(); });
      });
      var sel = document.createElement("select");
      ["Not started", "In progress", "Done"].forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        if (t.status === s) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        OfflineStore.setTaskStatus(t.id, sel.value);
        SiteCore.loadCrew().then(function (d) { data = d; renderTasks(); updateStats(); });
      });
      var priTd = document.createElement("td");
      priTd.textContent = t.priority || "";
      var taskTd = document.createElement("td");
      taskTd.textContent = t.task;
      var ownerTd = document.createElement("td");
      ownerTd.appendChild(ownerInput);
      var dueTd = document.createElement("td");
      dueTd.textContent = t.due || "";
      var statusTd = document.createElement("td");
      statusTd.appendChild(sel);
      tr.appendChild(priTd);
      tr.appendChild(taskTd);
      tr.appendChild(ownerTd);
      tr.appendChild(dueTd);
      tr.appendChild(statusTd);
      tbody.appendChild(tr);
    });
    var dl = el("owner-suggestions");
    if (dl) {
      dl.innerHTML = "";
      suggestions.forEach(function (name) {
        var opt = document.createElement("option");
        opt.value = name;
        dl.appendChild(opt);
      });
    }
  }

  function renderGuests() {
    var tbody = el("guest-table-body");
    if (!tbody || !data) return;
    tbody.innerHTML = "";
    (data.guests.list || []).forEach(function (g) {
      var tr = document.createElement("tr");
      var sel = document.createElement("select");
      ["Pending", "Yes", "No"].forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        if (String(g.rsvp).toLowerCase() === s.toLowerCase() ||
            (s === "Yes" && ["confirmed", "going"].indexOf(String(g.rsvp).toLowerCase()) >= 0)) {
          opt.selected = true;
        }
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        OfflineStore.setGuestRsvp(g.id, sel.value, g.headcount);
        SiteCore.loadCrew().then(function (d) { data = d; renderGuests(); updateStats(); });
      });
      tr.innerHTML = "<td>" + g.name + "</td><td>" + (g.group || "") + "</td><td>" + (g.headcount || 0) + "</td>";
      var td = document.createElement("td");
      td.appendChild(sel);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  function renderRunSheet() {
    var list = el("manage-run-sheet");
    if (!list || !data) return;
    list.innerHTML = "";
    (data.run_sheet || []).forEach(function (r) {
      var li = document.createElement("li");
      li.className = "run-item" + (r.done ? " done" : "");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = r.done;
      cb.addEventListener("change", function () {
        OfflineStore.setRunDone(r.id, cb.checked);
        SiteCore.loadCrew().then(function (d) { data = d; renderRunSheet(); });
      });
      li.innerHTML = "<time>" + r.time + "</time><div><strong>" + r.task + "</strong><span class='muted'>" + (r.owner || "") + "</span></div>";
      li.appendChild(cb);
      list.appendChild(li);
    });
  }

  function updateStats() {
    if (!data) return;
    el("stat-open").textContent = data.tasks.open;
    el("stat-guests").textContent = data.guests.headcount + "/" + data.guests.target;
    el("stat-rsvp").textContent = data.guests.pending;
  }

  function exportOverrides() {
    var blob = new Blob([JSON.stringify(OfflineStore.exportAll(), null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site-overrides-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
  }

  function importOverrides(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        OfflineStore.importAll(JSON.parse(reader.result));
        SiteCore.loadCrew().then(function (d) {
          data = d;
          renderTasks();
          renderGuests();
          renderRunSheet();
          updateStats();
          alert("Overrides imported.");
        });
      } catch (e) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  }

  el("export-overrides").addEventListener("click", exportOverrides);
  el("import-overrides-file").addEventListener("change", function (e) {
    if (e.target.files[0]) importOverrides(e.target.files[0]);
  });
  el("clear-overrides").addEventListener("click", function () {
    if (confirm("Clear all local site changes?")) {
      OfflineStore.clear();
      location.reload();
    }
  });

  SiteCore.loadCrew().then(function (d) {
    data = d;
    updateStats();
    renderTasks();
    renderGuests();
    renderRunSheet();
    if (d._offline) {
      el("manage-note").textContent = "Local overrides active — export JSON and run import-site-overrides.py to merge into Excel.";
    }
  });
})();