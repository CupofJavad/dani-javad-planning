(function () {
  var cfg = SiteCore.cfg();
  var publicData = null;
  var lightbox = null;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s || "";
    return d.innerHTML;
  }

  function fireConfetti() {
    if (typeof confetti !== "function") return;
    var colors = ["#D4AF37", "#F5E6A3", "#1A1A1A", "#FFFFFF"];
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.65 },
      colors: colors,
      disableForReducedMotion: true,
      zIndex: 300,
    });
    setTimeout(function () {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: colors, disableForReducedMotion: true });
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: colors, disableForReducedMotion: true });
    }, 200);
  }

  function initWelcomeGate() {
    var gate = document.getElementById("welcome-gate");
    var btn = document.getElementById("open-invite");
    if (!gate || !btn) return;
    if (sessionStorage.getItem("dj-invite-opened")) {
      gate.classList.add("dismissed");
      return;
    }
    btn.addEventListener("click", function () {
      gate.classList.add("dismissed");
      sessionStorage.setItem("dj-invite-opened", "1");
      fireConfetti();
    });
  }

  function initBubbles() {
    var field = document.getElementById("bubble-field");
    if (!field) return;
    for (var i = 0; i < 14; i++) {
      var b = document.createElement("span");
      b.className = "bubble";
      b.style.setProperty("--x", (5 + Math.random() * 90) + "%");
      b.style.setProperty("--d", (6 + Math.random() * 6) + "s");
      b.style.setProperty("--s", (0.5 + Math.random() * 0.8).toFixed(2));
      b.style.animationDelay = (Math.random() * 5) + "s";
      field.appendChild(b);
    }
  }

  function initSparkles() {
    var field = document.getElementById("sparkle-field");
    if (!field) return;
    for (var i = 0; i < 18; i++) {
      var s = document.createElement("span");
      s.className = "sparkle";
      s.style.top = (10 + Math.random() * 80) + "%";
      s.style.left = (5 + Math.random() * 90) + "%";
      s.style.animationDelay = (Math.random() * 3) + "s";
      field.appendChild(s);
    }
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    function check() {
      els.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight - 80) {
          el.classList.add("visible");
        }
      });
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  function initNav() {
    var nav = document.getElementById("guest-nav");
    var hero = document.querySelector(".guest-hero");
    if (!nav || !hero) return;
    window.addEventListener("scroll", function () {
      nav.classList.toggle("visible", window.scrollY > hero.offsetHeight * 0.5);
    }, { passive: true });
  }

  function initStickyRsvp() {
    var bar = document.getElementById("rsvp-sticky");
    var rsvp = document.getElementById("rsvp");
    if (!bar || !rsvp) return;
    window.addEventListener("scroll", function () {
      var rect = rsvp.getBoundingClientRect();
      var pastHero = window.scrollY > 400;
      var rsvpVisible = rect.top < window.innerHeight && rect.bottom > 0;
      bar.classList.toggle("visible", pastHero && !rsvpVisible);
    }, { passive: true });
  }

  function renderStats(data) {
    var rsvp = data.rsvp || {};
    var target = rsvp.target_headcount || cfg.event.guests_target || 61;
    var confirmed = rsvp.confirmed_headcount || 0;
    var elConfirmed = document.getElementById("stat-confirmed");
    var elTarget = document.getElementById("stat-target");
    var elHouseholds = document.getElementById("stat-households");
    if (elConfirmed) elConfirmed.textContent = confirmed;
    if (elTarget) elTarget.textContent = target;
    if (elHouseholds) {
      var local = (data.rsvp && data.rsvp.local_rsvps) || [];
      elHouseholds.textContent = local.filter(function (r) { return r.attending; }).length;
    }
  }

  function renderGuestTable(data) {
    var tbody = document.getElementById("rsvp-guest-list");
    if (!tbody) return;
    var rows = (data.rsvp && data.rsvp.local_rsvps) || [];
    if (!rows.length) {
      tbody.innerHTML = "<tr><td colspan=\"3\" class=\"muted\">Be the first to RSVP!</td></tr>";
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return "<tr><td>" + esc(r.name) + "</td><td>" +
        (r.attending ? "Yes" : "No") + "</td><td>" +
        (r.headcount || 1) + "</td></tr>";
    }).join("");
  }

  function renderTimeline() {
    var list = document.getElementById("guest-timeline");
    if (!list) return;
    var items = cfg.guestTimeline || [];
    list.innerHTML = items.map(function (item) {
      return "<li><time>" + esc(item.time) + "</time><div><strong>" +
        esc(item.title) + "</strong><span>" + esc(item.desc) + "</span></div></li>";
    }).join("");
  }

  function renderRegistries() {
    var grid = document.getElementById("registry-grid");
    if (!grid) return;
    var items = cfg.registries || [];
    grid.innerHTML = items.map(function (r) {
      var btn = r.ready && r.url
        ? "<a class=\"btn-gold\" href=\"" + esc(r.url) + "\" target=\"_blank\" rel=\"noopener\">Open</a>"
        : "<span class=\"btn-ghost\" style=\"opacity:0.6;cursor:default\">" + esc(r.note || "Coming soon") + "</span>";
      return "<div class=\"registry-card\"><h3>" + esc(r.name) + "</h3><p>" +
        esc(r.description) + "</p>" + btn + "</div>";
    }).join("");
  }

  function renderFaq() {
    var list = document.getElementById("faq-list");
    if (!list) return;
    (cfg.faq || []).forEach(function (item) {
      var d = document.createElement("details");
      d.className = "faq-item";
      d.innerHTML = "<summary>" + esc(item.q) + "</summary><p>" + esc(item.a) + "</p>";
      list.appendChild(d);
    });
  }

  function renderWeather() {
    var el = document.getElementById("weather-info");
    if (!el || !cfg.weather) return;
    el.innerHTML = "<p>" + esc(cfg.weather.summary) + "</p><p><strong>Tip:</strong> " + esc(cfg.weather.tip) + "</p>";
    var parking = document.getElementById("parking-info");
    if (parking && cfg.parking) parking.textContent = cfg.parking;
  }

  function renderLoveNotes(notes) {
    var wall = document.getElementById("love-notes-wall");
    if (!wall) return;
    if (!notes || !notes.length) {
      wall.innerHTML = "<p class=\"section-lead\">No notes yet — be the first to send love!</p>";
      return;
    }
    wall.innerHTML = notes.map(function (n) {
      return "<div class=\"love-note\"><strong>" + esc(n.name) + "</strong><p>\"" +
        esc(n.message) + "\"</p><time>" + new Date(n.created_at).toLocaleDateString() + "</time></div>";
    }).join("");
  }

  function renderGallery(photos) {
    var grid = document.getElementById("gallery-grid");
    if (!grid) return;
    var html = (photos || []).map(function (p) {
      return "<a href=\"" + esc(p.dataUrl) + "\" class=\"gallery-item glightbox\" data-gallery=\"engagement\">" +
        "<img src=\"" + esc(p.dataUrl) + "\" alt=\"Guest photo\" loading=\"lazy\" /></a>";
    }).join("");
    grid.innerHTML = html;
    if (window.GLightbox) {
      if (lightbox && lightbox.destroy) lightbox.destroy();
      lightbox = GLightbox({ selector: ".glightbox", touchNavigation: true, loop: true });
    }
  }

  function renderChecklist() {
    var list = document.getElementById("host-checklist");
    if (!list) return;
    var items = cfg.hostChecklist || [];
    var saved = OfflineStore.get().hostChecklist || {};
    list.innerHTML = items.map(function (item) {
      var done = saved[item.id] !== undefined ? saved[item.id] : item.done;
      return "<li class=\"" + (done ? "done" : "") + "\"><input type=\"checkbox\" id=\"chk-" +
        item.id + "\" data-id=\"" + item.id + "\"" + (done ? " checked" : "") +
        " /><label for=\"chk-" + item.id + "\">" + esc(item.text) + "</label></li>";
    }).join("");
    list.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        OfflineStore.setChecklistItem(cb.dataset.id, cb.checked);
        cb.closest("li").classList.toggle("done", cb.checked);
      });
    });
  }

  function initRsvpForm() {
    var form = document.getElementById("rsvp-form");
    var success = document.getElementById("rsvp-success");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var entry = {
        name: fd.get("name"),
        email: fd.get("email"),
        attending: fd.get("attending") === "yes",
        headcount: parseInt(fd.get("headcount"), 10) || 1,
        adults: parseInt(fd.get("adults"), 10) || 0,
        kids: parseInt(fd.get("kids"), 10) || 0,
        dietary: fd.get("dietary"),
        message: fd.get("message"),
      };
      OfflineStore.addRsvp(entry);

      if (entry.message) {
        OfflineStore.addLoveNote({ name: entry.name, message: entry.message });
      }

      if (entry.attending) fireConfetti();

      success.hidden = false;
      success.innerHTML = "<strong>Thank you, " + esc(entry.name) + "!</strong> " +
        (entry.attending ? "We can't wait to celebrate with you." : "We'll miss you — thank you for letting us know.") +
        "<p class=\"section-lead\">Your response is saved. Share the invite with friends who haven't RSVP'd yet!</p>";

      form.reset();
      refreshData();
      success.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function initLoveNoteForm() {
    var form = document.getElementById("love-note-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var note = { name: fd.get("name"), message: fd.get("message") };
      if (!note.name || !note.message) return;
      OfflineStore.addLoveNote(note);
      form.reset();
      refreshData();
      fireConfetti();
    });
  }

  function initGalleryUpload() {
    var input = document.getElementById("gallery-upload-input");
    var zone = document.getElementById("gallery-upload");
    if (!input || !zone) return;

    zone.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      Array.prototype.forEach.call(input.files, function (file) {
        if (!file.type.startsWith("image/")) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          OfflineStore.addGalleryPhoto({ dataUrl: ev.target.result, name: file.name });
          refreshData();
        };
        reader.readAsDataURL(file);
      });
      input.value = "";
    });
  }

  function initShare() {
    var copyBtn = document.getElementById("copy-invite");
    var shareBtn = document.getElementById("share-invite");
    var urlInput = document.getElementById("invite-url");
    var url = window.location.href.split("#")[0];
    if (urlInput) urlInput.value = url;

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        navigator.clipboard.writeText(url).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy link"; }, 2000);
        });
      });
    }

    if (shareBtn && navigator.share) {
      shareBtn.addEventListener("click", function () {
        navigator.share({
          title: "Dani & Javad — Engagement Party",
          text: "You're invited! August 8, 2026 in Sacramento.",
          url: url,
        });
      });
    } else if (shareBtn) {
      shareBtn.hidden = true;
    }
  }

  function refreshData() {
    SiteCore.loadPublic()
      .then(function (pub) {
        publicData = SiteCore.mergePublicData(pub);
        renderStats(publicData);
        renderGuestTable(publicData);
        renderLoveNotes(publicData.loveNotes);
        renderGallery(publicData.galleryPhotos);
      })
      .catch(function () {
        publicData = SiteCore.mergePublicData({});
        renderStats(publicData);
        renderGuestTable(publicData);
        renderLoveNotes(publicData.loveNotes);
        renderGallery(publicData.galleryPhotos);
      });
  }

  function boot() {
    initWelcomeGate();
    initBubbles();
    initSparkles();
    SiteCore.initLiveCountdown(document.getElementById("countdown-live"));
    renderTimeline();
    renderRegistries();
    renderFaq();
    renderWeather();
    renderChecklist();
    initRsvpForm();
    initLoveNoteForm();
    initGalleryUpload();
    initShare();
    initReveal();
    initNav();
    initStickyRsvp();
    refreshData();

    var desc = document.getElementById("guest-description");
    if (desc && cfg.guestDescription) desc.textContent = cfg.guestDescription;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();