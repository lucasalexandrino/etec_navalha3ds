(function () {
  "use strict";

  var mainBtn = document.getElementById("open-main");
  var agendaBtn = document.getElementById("open-agenda");
  var optLink = document.getElementById("open-options");

  function openUrl(url) {
    if (!url || !url.trim()) {
      chrome.runtime.openOptionsPage();
      return;
    }
    chrome.tabs.create({ url: url.trim() });
    window.close();
  }

  chrome.storage.sync.get(
    { mainUrl: "", agendaUrl: "" },
    function (cfg) {
      mainBtn.addEventListener("click", function () {
        openUrl(cfg.mainUrl);
      });
      agendaBtn.addEventListener("click", function () {
        openUrl(cfg.agendaUrl);
      });
    }
  );

  optLink.addEventListener("click", function (e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();
