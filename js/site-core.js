/** Shared site utilities — site-first data, no Google Sheets runtime dependency. */
window.SiteCore = (function () {
  function cfg() {
    return window.PLANNING_SITE || {};
  }

  function base() {
    var b = cfg().basePath || "/";
    if (b === "/") return "";
    return b.replace(/\/?$/, "/");
  }

  function asset(path) {
    return base() + path.replace(/^\//, "");
  }

  function fetchJson(path) {
    return fetch(asset(path)).then(function (r) {
      if (!r.ok) throw new Error("Failed " + path);
      return r.json();
    });
  }

  function mergeCrewData(crew) {
    if (!window.OfflineStore) return crew;
    var o = OfflineStore.get();
    var merged = JSON.parse(JSON.stringify(crew));

    if (merged.tasks && merged.tasks.all) {
      merged.tasks.all.forEach(function (t) {
        if (o.taskStatus[t.id]) t.status = o.taskStatus[t.id];
        if (o.taskOwner[t.id] !== undefined) t.owner = o.taskOwner[t.id];
      });
      var open = merged.tasks.all.filter(function (t) {
        return t.status.toLowerCase() !== "done";
      });
      merged.tasks.open = open.length;
      merged.tasks.done = merged.tasks.all.length - open.length;
      merged.tasks.progress_pct = merged.tasks.all.length
        ? Math.round((merged.tasks.done / merged.tasks.all.length) * 100)
        : 0;
      merged.tasks.upcoming = open
        .filter(function (t) { return t.due; })
        .sort(function (a, b) { return a.due.localeCompare(b.due); })
        .slice(0, 8);
    }

    if (merged.run_sheet) {
      merged.run_sheet.forEach(function (r) {
        if (o.runSheetDone[r.id] !== undefined) r.done = o.runSheetDone[r.id];
      });
    }

    if (merged.guests && merged.guests.list) {
      merged.guests.list.forEach(function (g) {
        if (o.guestRsvp[g.id]) {
          g.rsvp = o.guestRsvp[g.id].rsvp;
          if (o.guestRsvp[g.id].headcount != null) g.headcount = o.guestRsvp[g.id].headcount;
        }
      });
      o.rsvps.forEach(function (r) {
        merged.guests.list.push({
          id: r.id,
          name: r.name,
          group: r.group || "Web RSVP",
          type: r.type || "Adult",
          rsvp: r.attending ? "Yes" : "No",
          headcount: r.headcount || 1,
          dietary: r.dietary,
          source: "site-rsvp",
        });
      });
      merged.guests.headcount = merged.guests.list.reduce(function (s, g) {
        return s + (parseInt(g.headcount, 10) || 0);
      }, 0);
      merged.guests.pending = merged.guests.list.filter(function (g) {
        return String(g.rsvp).toLowerCase() === "pending";
      }).length;
      merged.guests.confirmed = merged.guests.list.filter(function (g) {
        return ["yes", "confirmed", "going"].indexOf(String(g.rsvp).toLowerCase()) >= 0;
      }).length;
    }

    merged._offline = OfflineStore.hasOverrides();
    return merged;
  }

  function loadCrew() {
    return fetchJson("data/planning-crew.json").then(mergeCrewData);
  }

  function loadPublic() {
    return fetchJson("data/planning-public.json");
  }

  function checkGoogleSheet() {
    var url = cfg().urls && cfg().urls.google_sheet;
    if (!url) return Promise.resolve({ up: false, optional: true });
    return fetch(url, { mode: "no-cors" })
      .then(function () { return { up: true }; })
      .catch(function () { return { up: false }; });
  }

  function daysUntil(d) {
    var target = new Date(d + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function partyTarget() {
    var ev = cfg().event || {};
    return new Date(ev.date + "T13:00:00-07:00");
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function initCountdown(ids) {
    var party = cfg().event && cfg().event.date;
    var rsvp = cfg().event && cfg().event.rsvp_deadline;
    if (!party) return;
    var dp = daysUntil(party);
    var dr = rsvp ? daysUntil(rsvp) : null;
    if (ids.daysParty) ids.daysParty.textContent = dp > 0 ? dp : dp === 0 ? "Today!" : "Past";
    if (ids.daysRsvp && dr !== null) {
      ids.daysRsvp.textContent = dr > 0 ? dr : dr === 0 ? "Today!" : "Passed";
    }
    if (ids.countdown) {
      ids.countdown.textContent = dp > 0
        ? dp + " days until the party"
        : dp === 0 ? "Party day!" : "Thanks for celebrating with us";
    }
  }

  function initLiveCountdown(container) {
    if (!container) return;
    var target = partyTarget();

    function tick() {
      var now = Date.now();
      var diff = target - now;
      if (diff <= 0) {
        container.innerHTML = "<span class=\"countdown-done\">The celebration has begun!</span>";
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);
      container.innerHTML =
        "<div class=\"countdown-block\"><span class=\"countdown-num\">" + days + "</span><span class=\"countdown-lbl\">Days</span></div>" +
        "<div class=\"countdown-block\"><span class=\"countdown-num\">" + pad(hours) + "</span><span class=\"countdown-lbl\">Hours</span></div>" +
        "<div class=\"countdown-block\"><span class=\"countdown-num\">" + pad(mins) + "</span><span class=\"countdown-lbl\">Minutes</span></div>" +
        "<div class=\"countdown-block\"><span class=\"countdown-num\">" + pad(secs) + "</span><span class=\"countdown-lbl\">Seconds</span></div>";
    }

    tick();
    setInterval(tick, 1000);
  }

  function mergePublicData(pub) {
    if (!window.OfflineStore) return pub;
    var merged = JSON.parse(JSON.stringify(pub || {}));
    var o = OfflineStore.get();
    var localYes = o.rsvps.filter(function (r) { return r.attending; });
    var localHeadcount = localYes.reduce(function (s, r) {
      return s + (parseInt(r.headcount, 10) || 1);
    }, 0);
    merged.rsvp = merged.rsvp || {};
    merged.rsvp.confirmed_headcount = (merged.rsvp.confirmed_headcount || 0) + localHeadcount;
    merged.rsvp.local_rsvps = o.rsvps;
    merged.loveNotes = o.loveNotes;
    merged.galleryPhotos = o.galleryPhotos;
    return merged;
  }

  function statusClass(status) {
    var s = (status || "").toLowerCase();
    if (s === "done") return "status-done";
    if (s.indexOf("progress") >= 0) return "status-progress";
    return "status-open";
  }

  return {
    cfg: cfg,
    base: base,
    asset: asset,
    loadCrew: loadCrew,
    loadPublic: loadPublic,
    mergeCrewData: mergeCrewData,
    mergePublicData: mergePublicData,
    checkGoogleSheet: checkGoogleSheet,
    initCountdown: initCountdown,
    initLiveCountdown: initLiveCountdown,
    partyTarget: partyTarget,
    statusClass: statusClass,
    daysUntil: daysUntil,
  };
})();