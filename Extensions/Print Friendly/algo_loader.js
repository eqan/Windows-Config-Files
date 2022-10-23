"use strict";

var pfLoadAlgoCalled = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request) {
    if (request.type === 'PfInitAlgoExtension') {
      window.extensionRootTabId = parseInt(request.payload.extensionRootTabId, 10);
      chrome.tabs.sendMessage(window.extensionRootTabId, {type: 'PfExtensionAlgoLoaded'});
    }
    if (request.type === 'PfLoadAlgo' && !pfLoadAlgoCalled) {
      pfLoadAlgoCalled = true
      var payload = request.payload;
      var pfData = payload.pfData;
      var urls = pfData.config.urls;

      PfAlgoStartHandler(payload);
    }
  }
});
