(function () {
  var form = document.getElementById("rsvp-form");
  var success = document.getElementById("rsvp-success");
  var cfg = SiteCore.cfg();

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

    var host = cfg.hostContact || {};
    var body = [
      "RSVP for Dani & Javad Engagement Party",
      "Name: " + entry.name,
      "Attending: " + (entry.attending ? "Yes" : "No"),
      "Headcount: " + entry.headcount,
      "Adults: " + entry.adults + ", Kids: " + entry.kids,
      entry.dietary ? "Dietary: " + entry.dietary : "",
      entry.message ? "Note: " + entry.message : "",
    ].filter(Boolean).join("\n");

    success.hidden = false;
    success.innerHTML =
      "<strong>Thank you!</strong> Your RSVP is saved on this site." +
      (entry.attending ? " We can't wait to celebrate with you." : " We'll miss you.") +
      '<p class="muted">Saved on this device. Please also tell the host or add your RSVP to the guest list in the planning spreadsheet.</p>' +
      '<button type="button" class="btn" id="copy-rsvp">Copy RSVP text</button>';

    document.getElementById("copy-rsvp").addEventListener("click", function () {
      navigator.clipboard.writeText(body).then(function () {
        document.getElementById("copy-rsvp").textContent = "Copied!";
      });
    });

    if (host.email) {
      var mailto = "mailto:" + encodeURIComponent(host.email) +
        "?subject=" + encodeURIComponent("RSVP: " + entry.name) +
        "&body=" + encodeURIComponent(body);
      var link = document.createElement("a");
      link.className = "btn btn-outline";
      link.href = mailto;
      link.textContent = "Email RSVP to host";
      success.appendChild(link);
    }

    form.reset();
    window.scrollTo({ top: success.offsetTop - 80, behavior: "smooth" });
  });

  SiteCore.initCountdown({
    countdown: document.getElementById("rsvp-countdown"),
  });
})();