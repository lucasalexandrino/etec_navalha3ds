(function () {
  "use strict";

  var form = document.getElementById("form");
  var mainInput = document.getElementById("mainUrl");
  var agendaInput = document.getElementById("agendaUrl");
  var statusEl = document.getElementById("status");

  chrome.storage.sync.get({ mainUrl: "", agendaUrl: "" }, function (cfg) {
    mainInput.value = cfg.mainUrl;
    agendaInput.value = cfg.agendaUrl;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    chrome.storage.sync.set(
      {
        mainUrl: mainInput.value.trim(),
        agendaUrl: agendaInput.value.trim(),
      },
      function () {
        statusEl.textContent = "Salvo.";
        setTimeout(function () {
          statusEl.textContent = "";
        }, 2500);
      }
    );
  });
})();
