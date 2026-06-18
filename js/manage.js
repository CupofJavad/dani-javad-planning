(function () {
  var data = null;

  function el(id) { return document.getElementById(id); }

  function renderTasks() {
    var tbody = el("task-table-body");
    if (!tbody || !data) return;
    tbody.innerHTML = "";
    (data.tasks.all || []).forEach(function (t) {
      var tr = document.createElement("tr");
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
      tr.innerHTML = "<td>" + (t.priority || "") + "</td><td>" + t.task + "</td><td>" + (t.owner || "") + "</td><td>" + (t.due || "") + "</td>";
      var td = document.createElement("td");
      td.appendChild(sel);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
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