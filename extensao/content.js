(function () {
  "use strict";

  var root = document.documentElement;
  if (!root.hasAttribute("data-navalha-site")) return;
  if (document.getElementById("navalha-agenda-fab")) return;

  chrome.storage.sync.get({ agendaUrl: "" }, function (cfg) {
    if (!cfg.agendaUrl || !cfg.agendaUrl.trim()) return;

    var a = document.createElement("a");
    a.id = "navalha-agenda-fab";
    a.href = cfg.agendaUrl.trim();
    a.textContent = "Agendar";
    a.setAttribute("aria-label", "Abrir agenda Navalha em nova aba");
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    document.body.appendChild(a);
  });
})();
