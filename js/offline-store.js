/** Browser-local overrides when Google Sheets / Excel publish is unavailable. */
window.OfflineStore = (function () {
  var KEY = "dj-planning-overrides-v1";

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    data.updated_at = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }

  function ensure() {
    var d = load();
    if (!d.rsvps) d.rsvps = [];
    if (!d.taskStatus) d.taskStatus = {};
    if (!d.taskOwner) d.taskOwner = {};
    if (!d.runSheetDone) d.runSheetDone = {};
    if (!d.guestRsvp) d.guestRsvp = {};
    if (!d.loveNotes) d.loveNotes = [];
    if (!d.galleryPhotos) d.galleryPhotos = [];
    if (!d.hostChecklist) d.hostChecklist = {};
    return d;
  }

  return {
    get: ensure,
    addRsvp: function (entry) {
      var d = ensure();
      entry.id = entry.id || "rsvp-" + Date.now();
      entry.submitted_at = new Date().toISOString();
      d.rsvps.push(entry);
      return save(d);
    },
    addLoveNote: function (note) {
      var d = ensure();
      note.id = note.id || "note-" + Date.now();
      note.created_at = new Date().toISOString();
      d.loveNotes.unshift(note);
      return save(d);
    },
    addGalleryPhoto: function (photo) {
      var d = ensure();
      photo.id = photo.id || "photo-" + Date.now();
      photo.uploaded_at = new Date().toISOString();
      d.galleryPhotos.unshift(photo);
      return save(d);
    },
    removeGalleryPhoto: function (id) {
      var d = ensure();
      d.galleryPhotos = d.galleryPhotos.filter(function (p) { return p.id !== id; });
      return save(d);
    },
    setChecklistItem: function (id, done) {
      var d = ensure();
      d.hostChecklist[id] = !!done;
      return save(d);
    },
    setTaskStatus: function (taskId, status) {
      var d = ensure();
      d.taskStatus[taskId] = status;
      return save(d);
    },
    setTaskOwner: function (taskId, owner) {
      var d = ensure();
      d.taskOwner[taskId] = owner;
      return save(d);
    },
    setRunDone: function (runId, done) {
      var d = ensure();
      d.runSheetDone[runId] = !!done;
      return save(d);
    },
    setGuestRsvp: function (guestId, rsvp, headcount) {
      var d = ensure();
      d.guestRsvp[guestId] = { rsvp: rsvp, headcount: headcount };
      return save(d);
    },
    exportAll: function () {
      return ensure();
    },
    importAll: function (json) {
      return save(json);
    },
    clear: function () {
      localStorage.removeItem(KEY);
    },
    hasOverrides: function () {
      var d = ensure();
      return d.rsvps.length > 0 ||
        d.loveNotes.length > 0 ||
        d.galleryPhotos.length > 0 ||
        Object.keys(d.taskStatus).length > 0 ||
        Object.keys(d.taskOwner).length > 0 ||
        Object.keys(d.runSheetDone).length > 0 ||
        Object.keys(d.guestRsvp).length > 0 ||
        Object.keys(d.hostChecklist).length > 0;
    },
  };
})();