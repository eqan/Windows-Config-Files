"use strict";

var pfLoadCoreCalled = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request) {
    if (request.type === 'PfInitCoreExtension') {
      window.extensionRootTabId = parseInt(request.payload.extensionRootTabId, 10);
      chrome.tabs.sendMessage(window.extensionRootTabId, {type: 'PfExtensionCoreLoaded'});
    }
    if (request.type === 'PfLoadCore' && !pfLoadCoreCalled) {
      pfLoadCoreCalled = true;
      PfStartCoreHandler(request.payload);
    }
  }
});
