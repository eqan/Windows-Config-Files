// Resize observer used for redrawing the text when the video size changes.
var resizeObserverMap = new Map();

// Basic information about the last selection made
var currentSelectionInfo;

// Whether selectext is paused or not
var isPaused = false;

// The copymode
var copyMode = "multiline";

// Load Open Sans using JS for Chrome/Firefox compatibility
loadCustomFonts();

/**
 * Load the active colour from storage and set it, and search for the video on the page.
 */
$(document).ready(async () => {
  setCopyMode();
  if (await isSelectextEnabled()) {
    findVideo();
  }
});

function setCopyMode() {
  browser.storage.sync.get({ "copyMode": copyMode }).then(
    (res) => {
      copyMode = res.copyMode;
    }
  )
}

/**
 * Attach Selectext to all videos initially found on the page
 */
function findVideo(instantlyShowToggle = false) {
  let videos = document.getElementsByTagName("video");
  for (let i = 0; i < videos.length; i++) {
    let video = videos[i];

    if (instantlyShowToggle && video.paused) {
      onVideoPause(video);
    }

    addVideoEventListeners(video);
  }

  findVideoAsync();
}

/**
 * Find the first video loaded with js using arrive. Unbind after the first video is found for performance and it is unlikely
 * Youtube will switch to loading more than 1 video per page.
 */
function findVideoAsync() {
  document.arrive("video", (video) => {
    addVideoEventListeners(video);
  });
}


function videoIsValid(video) {
  let $video = $(video);
  let width = $video.width();
  let height = $video.height();
  let size = width * height;

  // If the video is too small, it is probably not a video
  if (size < MIN_VIDEO_SIZE) {
    return false;
  }

  return true;
}

/**
 * Set the active colour css variable.
 * @param {string} colour the CSS colour to set to.
 */
function setColour(colour) {
  // In shadow roots
  const hosts = $(".selectextShadowHost").get();
  if (hosts !== undefined) {
    for (let i = 0; i < hosts.length; i++) {
      hosts[i].style.setProperty("--activeColour", colour);
    }
  }
}

/**
 * Add pause and play listeners to the HTML video element.
 * @param {Element} video the HTML video element.
 */
function addVideoEventListeners(video) {
  video.addEventListener("pause", onVideoPauseWrapper);
  video.addEventListener("play", onVideoPlayWrapper);
}

function removeVideoEventListeners(video) {
  video.removeEventListener("pause", onVideoPauseWrapper);
  video.removeEventListener("play", onVideoPlayWrapper);
}


function onVideoPauseWrapper(e) {
  onVideoPause(e.target);
}

function onVideoPlayWrapper(e) {
  onVideoPlay(e.target);
}

/**
 * Insert the video overlay and toggle into the DOM when video paused.
 * @param {Element} video the HTML video element.
 */
function onVideoPause(video) {
  sendAndResetCurrentSelectionInfo();
  if (videoIsValid(video) !== true) {
    return;
  }

  if (video.currentTime === video.duration) {
    return
  }


  browser.storage.sync.get({ activeColour: "rgb(0, 185, 251)" }).then(function (result) {
    //Create div overlaid on top of Youtube video with toggle switch
    const videoOverlay = createVideoOverlayAndToggle(video);
    resizeVideoOverlay(video, videoOverlay, false);
    // Wait for 50 ms to stop scrubbing through the video inserting overlay
    setTimeout(() => {
      if (video.paused && getShadowHostForVideo(video).length === 0) {
        insertOverlayIntoDOM(video, videoOverlay);
        setColour(result.activeColour);
        addResizeObserver(video, videoOverlay);
        video.ontimeupdate = () => onScrubWhilePaused(video, videoOverlay);
      }
    }, 50);
  });
}

function getShadowHostForVideo(video) {
  return $(video.parentNode).find(".selectextShadowHost")
}

/**
 * Remove the video overlay when the video starts playing again.
 * @param {Element} video the HTML video element.
 */
function onVideoPlay(video) {
  const shadowHost = getShadowHostForVideo(video);
  if (shadowHost.length > 0) {

    shadowHost.remove();
    sendAndResetCurrentSelectionInfo();
  }

  const resizeObserver = getResizeObserverForVideo(video)
  if (resizeObserver !== undefined) {
    resizeObserver.disconnect();
  }

  video.ontimeupdate = undefined;
}

/**
 * Create a div positioned in front of the video with the same dimensions.
 * @param {Element} video the HTML video element
 * @returns {Element} the video overlay HTML div element.
 */
function createVideoOverlayAndToggle(video) {
  //The HTML element that is overlayed on top of the video element
  var videoOverlay = document.createElement("div");
  videoOverlay.id = "videoOverlay";

  videoOverlay.style.width = "0px";
  videoOverlay.style.height = "0px";

  videoOverlay.style.position = "absolute";

  // Add the panel with the toggle to the top left
  const cornerPanel = createCornerPanel(video, videoOverlay);
  const { toggle, input } = createToggle(video, videoOverlay);
  cornerPanel.appendChild(toggle);

  videoOverlay.appendChild(cornerPanel);

  // Set the toggle to false and clear text when video scrubbed

  return videoOverlay;
}

/**
 * Create the corner panel and return it
 * @returns {HTMLDivElement} The HTML image of the logo
 */
function createCornerPanel(video, videoOverlay) {
  const cornerWrapper = document.createElement("div");
  cornerWrapper.addEventListener("click", (event) => event.stopPropagation());
  cornerWrapper.id = "cornerWrapper";

  adjustTogglePos(cornerWrapper, video, videoOverlay)

  const onFullScreenChange = () => {

    setTimeout(() => {
      adjustTogglePos(undefined, video, videoOverlay)
    }, 10);
  }
  document.addEventListener("fullscreenchange", onFullScreenChange);

  video.addEventListener("play", () => {
    document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, { once: true });

  return cornerWrapper;
}

/**
 * Creates the toggle HTML element
 * @returns {HTMLLabelElement} the toggle HTML element
 */
function createToggle(video, videoOverlay) {
  let toggle = document.createElement("label");
  toggle.id = "outerToggle";
  toggle.className = "switch";

  const input = document.createElement("input");
  input.id = "selecTextToggle";
  input.type = "checkbox";
  input.checked = false;

  const span = document.createElement("span");
  span.className = "slider round";

  toggle.appendChild(input);
  toggle.appendChild(span);

  return {
    toggle: toggle,
    input: input,
  };
}

/**
 * Inject the video overlay on top of the video, but ensure the controls are still usable. 
 * @param {Element} video the HTML video element.
 * @param {Element} videoOverlay the HTML video overlay element.
 */
function insertOverlayIntoDOM(video, videoOverlay) {
  // Create the shadow root to isolate styles from webpage
  let shadowHost = document.createElement("DIV");
  shadowHost.className = "selectextShadowHost";
  shadowHost.attachShadow({ mode: "open" });
  let shadowRoot = shadowHost.shadowRoot;

  // Add the videoOverlay to the shadowRoot
  shadowRoot.appendChild(videoOverlay);

  // Add style sheets to shadowroot
  addStyleSheet(shadowRoot, "shadow.css")
  addStyleSheet(shadowRoot, "login.css")

  // Insert video overlay
  video.parentNode.insertBefore(shadowHost, video.nextSibling);

  let toggle = queryShadowRoot("#outerToggle", false, videoOverlay);

  setTimeout(() => ensureToggleIsClickable(video, videoOverlay, toggle), 100);
}


function ensureToggleIsClickable(video, videoOverlay, toggle) {
  let toggleClickHandlerClick = (e) => toggleClickCapturer(e, video, videoOverlay, toggle, true)
  let toggleClickHandlerNoClick = (e) => toggleClickCapturer(e, video, videoOverlay, toggle, false)

  if (toggle.getAttribute('click') !== 'true') {
    document.addEventListener(
      "click",
      toggleClickHandlerNoClick,
      true
    );
  }

  if (toggle.getAttribute('mousedown') !== 'true') {
    document.addEventListener(
      "mousedown",
      toggleClickHandlerClick,
      true
    )
  }

  if (toggle.getAttribute('mouseup') !== 'true') {
    document.addEventListener(
      "mouseup",
      toggleClickHandlerNoClick,
      true
    )
  }

  video.addEventListener(
    "play",
    () => {
      document.removeEventListener("click", toggleClickHandlerNoClick, true);
      document.removeEventListener("mousedown", toggleClickHandlerClick, true);
      document.removeEventListener("mouseup", toggleClickHandlerNoClick, true);
    },
    { once: true });
}


function toggleClickCapturer(e, video, videoOverlay, toggle, isClick) {
  toggle.setAttribute(e.type, 'true');

  let togglePos = toggle.getBoundingClientRect();

  if (togglePos.width === 0 || togglePos.height === 0) {
    return;
  }

  let clickX = e.clientX;
  let clickY = e.clientY;

  if (clickX === 0 || clickY === 0) {
    return;
  }

  // If the click is inside the bounding rect of the toggle
  if (clickX >= togglePos.left && clickX <= togglePos.right && clickY >= togglePos.top && clickY <= togglePos.bottom) {
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()

    if (isClick === true) {
      let input = queryShadowRoot("#selecTextToggle", false, videoOverlay)
      programmaticallyClickToggle(video, videoOverlay, input);
    }
  }
}


function programmaticallyClickToggle(video, videoOverlay, input) {
  input.checked = !input.checked
  onToggleClick(video, videoOverlay, input.checked)
}


function addStyleSheet(element, styleSheetPath) {
  // Add style from login.css to the shadowRoot
  var styleSheetURL = browser.runtime.getURL(styleSheetPath);
  $(element).append(
    $("<link>")
      .attr("rel", "stylesheet")
      .attr("type", "text/css")
      .attr("href", styleSheetURL)
  );
}

/**
 * Perform logic when the toggle is clicked.
 * @param {Element} video the HTML video element
 * @param {Element} videoOverlay the HTML video overlay element
 * @param {Event} event the click event.
 */
function onToggleClick(video, videoOverlay, checked) {
  if (checked !== undefined) {
    // Query the current elements showing in the overlay
    let textWrapper = queryShadowRoot("#textWrapper", false, videoOverlay);
    let loader = queryShadowRoot("#selecTextLoader", false, videoOverlay);
    let message = queryShadowRoot("#persistentMessage", false, videoOverlay);
    let loginWrapper = queryShadowRoot(".selectextLoginWrapper", false, videoOverlay);
    let limitWrapper = queryShadowRoot(".selectextLimitWrapper", false, videoOverlay);

    //The toggle was turned on
    if (checked === true) {
      if (textWrapper === null && loader === null && message === null && loginWrapper === null && limitWrapper === null) {
        selectextActivated(video, videoOverlay);
      } else {
        // Show the text wrapper and/or loader
        if (textWrapper !== null) {
          textWrapper.style.visibility = "visible";
        } else if (loader !== null) {
          loader.style.visibility = "visible";

          // Show a message again if it is persistent
        } else if (message !== null) {
          let oldText = message.innerText;
          message.remove();
          showFadingMessage(oldText, 2000, true, null, videoOverlay);
        } else if (loginWrapper !== null) {
          loginWrapper.style.visibility = "visible";
        } else if (limitWrapper !== null) {
          limitWrapper.style.visibility = "visible";
        }
      }

      // The toggle was turned off
    } else if (checked === false) {
      // Hide the text wrapper and/or loader
      if (loader !== null) {
        loader.style.visibility = "hidden";
      }
      if (textWrapper !== null) {
        textWrapper.style.visibility = "hidden";
      }
      if (loginWrapper !== null) {
        loginWrapper.style.visibility = "hidden";
      }
      if (limitWrapper !== null) {
        limitWrapper.style.visibility = "hidden";
      }
    }
  }
}

/**
 * Capture the current video frame, perform OCR, and render the HTML text on top of the video.
 * @param {Element} video the HTML video element
 * @param {Element} videoOverlay the HTML video overlay element
 */
function selectextActivated(video, videoOverlay) {
  //Add a loading spinner to the center of the overlay
  let spinner = addSpinner(videoOverlay);

  addResizeObserver(video, videoOverlay);

  detectAndRenderText(video, videoOverlay);
}

/**
 * Get the position of the video in the viewport, used for cropping the browser screenshot
 * @param {Element} video the HTML video element
 * @returns {Object} the object containing video position as returned by getBoundingClientRect
 */
function getScreenPositionOfVideo(video) {
  let rect = video.getBoundingClientRect();
  let { leftOffset, topOffset } = getBlackBarOffset(video)
  return {
    top: rect.top + topOffset,
    left: rect.left + leftOffset,
    width: rect.width - leftOffset * 2,
    height: rect.height - topOffset * 2
  };
}


function getViewportDimensions() {
  const vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );

  return {
    width: vw,
    height: vh
  }
}

(function ($) {
  var timeout;
  $(document).on('mousemove', function (event) {
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(function () {
      // trigger the new event on event.target, so that it can bubble appropriately
      $(event.target).trigger('mousemoveend');
    }, 1000);
  });
}(jQuery));


function diamondDrillOnMouseMove(video, videoOverlay) {
  const onMouseMove = (e) => {
    setTimeout(() => {
      const videoBoundingRect = video.getBoundingClientRect();
      if (e.clientX > videoBoundingRect.left && e.clientX < videoBoundingRect.right && e.clientY > videoBoundingRect.top && e.clientY < videoBoundingRect.bottom) {
        const textWrapper = queryShadowRoot("#textWrapper", false, videoOverlay);
        textWrapperDiamondDrill(textWrapper, video, videoOverlay);
      }
    }, 50);
  }

  document.addEventListener('mousemove', onMouseMove, { once: true });
  return onMouseMove
}

function mouseMoveDiamondDrillHacks(video, videoOverlay) {
  const onMouseMove = diamondDrillOnMouseMove(video, videoOverlay);
  const onMouseMoveEnd = (event) => diamondDrillOnMouseMove(video, videoOverlay);
  $(document).on('mousemoveend', onMouseMoveEnd);

  video.addEventListener("play", () => {
    document.removeEventListener('mousemove', onMouseMove);
    $(document).off('mousemoveend')
  }, { once: true });

  let input = queryShadowRoot("#selecTextToggle", true, videoOverlay);
  input.change(
    (e) => {
      if (e.target.checked) {
        const onMouseMoveEnd = (event) => diamondDrillOnMouseMove(video, videoOverlay);
        $(document).on('mousemoveend', onMouseMoveEnd);
      } else {
        document.removeEventListener('mousemove', onMouseMove);
        $(document).off('mousemoveend')
      }
    }
  )
}

/**
 * Detect the text, and render it on top of the video
 * @param {Element} video the HTML video element
 * @param {Element} videoOverlay the HTML video overlay element
 * @param {Element} spinner the spinner HTML element
 */
function detectAndRenderText(video, videoOverlay) {
  const timeOfButtonPress = video.currentTime;

  // Get the position of the video in the viewport
  const videoPosition = getScreenPositionOfVideo(video);

  const quality = 1.0;


  const loginListener = (request) => {
    if (request.type !== undefined) {
      if (request.type === "login") {
        showLoginPopup(videoOverlay, video);
      } else if (request.type === "login_success") {
        queryShadowRoot(".selectextLoginWrapper", true, videoOverlay).remove();
        addSpinner(videoOverlay);
      }
    }
  }

  browser.runtime.onMessage.addListener(loginListener);

  if (inIframe()) {

    // Get the offset of the iframe to the current window with postmessage
    let onIframeDimensionsResponse = (e) => {
      if (e.data.type == "SELECTEXT_IFRAME_DIMENSIONS_RESPONSE") {
        const iframeDimensions = e.data.iframeDimensions;
        videoPosition.left += iframeDimensions.left;
        videoPosition.top += iframeDimensions.top;

        const viewportDimensions = e.data.viewportDimensions;
        doOCR(videoPosition, viewportDimensions, quality, videoOverlay, video, loginListener, timeOfButtonPress, spinner);
        window.removeEventListener("message", onIframeDimensionsResponse);
      }
    }

    window.addEventListener("message", onIframeDimensionsResponse);

    window.top.postMessage({
      type: "SELECTEXT_IFRAME_DIMENSIONS_REQUEST",
      iframeSrc: window.location.href
    }, "*")

  } else {
    const viewportDimensions = getViewportDimensions();
    doOCR(videoPosition, viewportDimensions, quality, videoOverlay, video, loginListener, timeOfButtonPress);
  }
}

function isCanvasBlank(canvas) {
  const context = canvas.getContext('2d');

  const pixelBuffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
  );

  const res = !pixelBuffer.some(color => color !== 0);
  console.log(res)
  return res;
}

function canvasCaptureSiteListIncludesThisSite() {
  const siteName = getSiteNameFromURL(window.location.href);
  for (let canvasCaptureSite of CANVAS_CAPTURE_SITE_LIST) {
    if (siteName.endsWith(canvasCaptureSite)) {
      return true;
    }
  }
  return false;
}

async function doOCR(videoPosition, viewportDimensions, quality, videoOverlay, video, loginListener, timeOfButtonPress) {
  // Send the dataUri representing the current video frame to the background script to handle performing OCR
  let videoDataUri;
  if (canvasCaptureSiteListIncludesThisSite()) {
    videoDataUri = await captureVideoFrameCanvas(video, undefined, undefined, {width: videoPosition.width, height: videoPosition.height}).dataUri
  } else {
    const pageDataURI = await browser.runtime.sendMessage({ type: "capture" })
    videoDataUri = await captureVideoFrame(videoPosition, viewportDimensions, quality, pageDataURI);
  }
  
  browser.runtime.sendMessage({
    type: "ocr",
    dataURI: videoDataUri,
    url: window.location.href,
  }).then(
    (response) => {
      const processResponse = (res) => {
        browser.runtime.onMessage.removeListener(loginListener);

        // If the video is still paused in the same place once OCR is finished
        if (timeOfButtonPress === video.currentTime) {
          let textAnnotations = processGoogleCloudVisionAPICall(res, videoOverlay);
          let simpleAnnotations = googleCloudVisionAnnotationsMapper(textAnnotations);
          let detectedLanguages = getDetectedLanguagesFromCloudVisionFullTextAnnotations(textAnnotations);

          if (textAnnotations !== undefined) {
            let textWrapper = drawText(
              video,
              videoOverlay,
              simpleAnnotations,
              videoPosition
            );

            if (textWrapper !== undefined) {
              textWrapperDiamondDrill(textWrapper, video, videoOverlay);
            }

            mouseMoveDiamondDrillHacks(video, videoOverlay);

            resizeVideoOverlay(video, videoOverlay);

            addResizeObserver(
              video,
              videoOverlay,
              simpleAnnotations,
              videoPosition
            );
            initCurrentSelectionInfo(timeOfButtonPress, detectedLanguages);
          }
        }

        queryShadowRoot("#selecTextLoader", true, videoOverlay).remove();
      }
      if (response === "login") {
        const ocrDoneListener = (res) => {
          if (res.type !== undefined && res.type === "OCR") {
            processResponse(res.json);
            browser.runtime.onMessage.removeListener(ocrDoneListener);
          }
        }
        browser.runtime.onMessage.addListener(ocrDoneListener);
      } else if (response.type !== undefined && response.type === "limitExceeded") {
        showOutOfCreditsPopup(video, videoOverlay, response.limit, response.planIsFree)
      } else {
        processResponse(response);
      }
    }
  )



}


function captureVideoFrameCanvas(video, format, quality, scaleTo) {
  format = format || 'jpeg';
  quality = quality || 0.92;

  if (!video || (format !== 'png' && format !== 'jpeg')) {
    return false;
  }

  //Draw the video's current frame onto a canvas
  var canvas = document.createElement("CANVAS");
  if (scaleTo !== undefined) {
    canvas.width = scaleTo.width;
    canvas.height = scaleTo.height;
  } else {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  }

  video.crossOrigin = "anonymous";



  

  if (scaleTo !== undefined) {
    canvas.getContext('2d').drawImage(video, 0, 0, scaleTo.width, scaleTo.height);
  } else {
    canvas.getContext('2d').drawImage(video, 0, 0);
  }

  //Extract data URL and trim type information text
  var dataUri = canvas.toDataURL('image/' + format, quality);
  let trimmedDataUri = dataUri.substring(dataUri.indexOf(",") + 1);

  var data = dataUri.split(',')[1];
  var mimeType = dataUri.split(';')[0].slice(5)

  var bytes = window.atob(data);
  var buf = new ArrayBuffer(bytes.length);
  var arr = new Uint8Array(buf);

  for (var i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }

  var blob = new Blob([arr], { type: mimeType });

  return { "dataUri": trimmedDataUri, "untrimmedDataUri": dataUri, "blob": blob };
}


function showOutOfCreditsPopup(video, videoOverlay, limit, planIsFree) {
  console.log(planIsFree)
  if (queryShadowRoot(".selectextLimitWrapper", true, videoOverlay).length > 0) {
    return;
  }
  const limitPage = browser.runtime.getURL("limit.html");

  const $limitWrapper = $('<div class="selectextLimitWrapper"></div>');

  $limitWrapper
    .appendTo($(videoOverlay))
    .load(limitPage, () => onLimitLoaded(limit, planIsFree));

  $limitWrapper.click((e) => e.stopPropagation());
  $limitWrapper.mousedown((e) => e.stopPropagation());
  $limitWrapper.mouseup((e) => e.stopPropagation());

  queryShadowRoot("#selecTextLoader", true, videoOverlay).remove();

  setTimeout(
    () => limitWrapperDiamondDrill($limitWrapper, video, videoOverlay), 200
  )
}


function limitWrapperDiamondDrill(limitWrapper, video, videoOverlay) {
  const upgradeButton = limitWrapper.find(".upgradeButton").get(0);

  if (upgradeButton !== undefined) {
    ensureTextWrapperIsClickable(upgradeButton, video, videoOverlay);
  }
}


/**
 * Query element(s) in the selectext shadow root
 * @param {String} selector the CSS selector used to find the element(s)
 * @param {Boolean} isJquery if true, the element(s) will be returned as a Jquery object, otherwise a JS element
 * @param {Element} queryRoot an element to call 'find' with
 * @returns A Jquery Object or JS element(s) found by the selector
 */
function queryShadowRoot(selector, isJquery = true, queryRoot = null) {


  if (queryRoot === null) {
    let shadowHost = $(".selectextShadowHost")

    if (shadowHost.length === 0) {
      if (isJquery === true) {
        return shadowHost;
      } else {
        return null;
      }
    }

    // Get all shadow roots inside shadowhosts Jquery object as a jquery object
    queryRoot = $(shadowHost.get().map((shadowHost) => shadowHost.shadowRoot));

  } else {
    queryRoot = $(queryRoot);
  }

  let jqueryCollection = queryRoot.find(selector);



  if (isJquery === true) {
    return jqueryCollection
  } else {

    if (jqueryCollection.length > 1) {
      return jqueryCollection.get()
    } else if (jqueryCollection.length != 0) {
      return jqueryCollection.get(0)
    } else {
      return null
    }
  }
}

/**
 * Process the response from the Google Cloud Vision API to determine how to proceed.
 * @param {JSON} response the JSON response from the Cloud Vision API
 * @return textAnnotations the array of JSON object representing the text nodes in the format returned by the
 * Google Cloud Vision API.
 */
function processGoogleCloudVisionAPICall(response, videoOverlay) {
  if (response.error) {
    showFadingMessage(response.error, 7000, true, null, videoOverlay);
    return;
  }

  if (response.responses === undefined) {
    showFadingMessage("The Google Cloud Vision API is unavailable.", 7000, true, null, videoOverlay);
    return;
  }

  // The array of JSON information about each text node.
  var textAnnotations = response.responses[0].fullTextAnnotation;

  //There is no text found
  if (textAnnotations === undefined) {
    showFadingMessage("No text detected", 2000, true, null, videoOverlay);
    return;
  }



  return textAnnotations;
}


function getDetectedLanguagesFromCloudVisionFullTextAnnotations(fullTextAnnotations) {
  const pages = _.get(fullTextAnnotations, "pages", []);
  let detectedLanguages = [];
  for (const page of pages) {
    let pageDetectedLanguages = _.get(page, "property.detectedLanguages", []);
    for (const detectedLanguage of pageDetectedLanguages) {
      if (detectedLanguage.confidence > 0.5) {
        detectedLanguages.push(detectedLanguage.languageCode);
      }
    }
  }
  return detectedLanguages;
}

function googleCloudVisionAnnotationsMapper(fullTextAnnotations) {

  const annotations = [];

  const pages = _.get(fullTextAnnotations, "pages", []);

  for (const page of pages) {
    let blocks = page.blocks;
    for (const block of blocks) {
      let paragraphs = block.paragraphs;
      for (const paragraph of paragraphs) {
        let words = paragraph.words;
        for (const word of words) {
          let symbols = word.symbols;

          let wordText = "";
          for (const symbol of symbols) {
            let character = symbol.text;
            wordText += character;
          }

          let wordBoundingBox = word.boundingBox.vertices;

          annotations.push({
            text: wordText,
            boundingBox: wordBoundingBox
          });
        }
      }
    }
  }

  return {
    annotations: annotations,
    fullText: _.get(fullTextAnnotations, "text", "")
  }
}


/**
 * Generate HTML representing selectable text and insert it into the DOM in front of the video.
 * @param {Element} video the HTML video element.
 * @param {Element} videoOverlay the HTML div element overlaid on top of the video.
 * @param {Array} textAnnotations the array of JSON object representing the text nodes in the format returned by
 * the Google Cloud Vision API.
 */
function drawText(video, videoOverlay, textAnnotations, videoPosition) {
  let newPos = getScreenPositionOfVideo(video);
  let width = newPos.width;
  let height = newPos.height;

  // The change in size between what the video was initially, and what it is now
  var scaleFactor = width / videoPosition.width;
  var scaleFactorY = height / videoPosition.height;

  let textWrapper = document.createElement("div");
  textWrapper.id = "textWrapper";

  videoOverlay.appendChild(textWrapper);

  let annotations = textAnnotations.annotations;

  let selectable = enableDragSelect(textWrapper, videoOverlay);

  stopDragSelectResumingVideo(textWrapper, selectable)

  let { leftOffset, topOffset } = getBlackBarOffset(video);

  //Loop through text annotations returned by the OCR API and add them to the video overlay div as divs with text inside
  for (var i = 0; i < annotations.length; i++) {
    //Create green highlight colour div containing invisible text
    let textDiv = document.createElement("div");
    textDiv.style.visibility = "hidden";
    textWrapper.appendChild(textDiv);

    textDiv.className = "selectextText";

    let text = annotations[i].text;
    // Use this instead of innerHTML to avoid XSS
    let textNode = document.createTextNode(text);
    textDiv.appendChild(textNode);
    selectable.add(textDiv);

    //The font size of the text based on the height of the bounding box
    let fontSize = `${(annotations[i].boundingBox[2].y -
      annotations[i].boundingBox[0].y) *
      scaleFactor
      }px`;
    textDiv.style.fontSize = fontSize;

    textDiv.style.left = `${annotations[i].boundingBox[0].x * scaleFactor + leftOffset
      }px`;

    //Calculate the empty space between height of the div and the font size and move up half of this to make top and bottom space even
    let differenceInHeightAndFontSize =
      textDiv.offsetHeight - parseInt(fontSize, 10);

    textDiv.style.top = `${annotations[i].boundingBox[0].y * scaleFactor -
      differenceInHeightAndFontSize / 2 +
      topOffset
      }px`;

    //Stretch the div containing the text so its width is slightly larger than the bounding box returned by the API
    let detectedWidth =
      (annotations[i].boundingBox[1].x -
        annotations[i].boundingBox[0].x) *
      scaleFactor;


    // Wait 10ms to ensure textDiv is rendered (width returns an accurate result)
    setTimeout(
      () => {
        let actualWidth = $(textDiv).width();
        let actualHeight = $(textDiv).height();
        textDiv.style.transform = `scale(${detectedWidth / actualWidth}, 1)`;

        let borderWidth = 1 + actualHeight / 20;
        if (borderWidth > 2) {
          borderWidth = 2;
        }
        textDiv.style.borderWidth = borderWidth + "px";
        textDiv.style.removeProperty("visibility")
      }, 10
    )
  }

  // Don't show the text if the toggle was turned off
  let toggle = queryShadowRoot("#selecTextToggle", false, videoOverlay);
  if (toggle !== null && toggle.checked === false) {
    textWrapper.style.visibility = "hidden";
  }

  return textWrapper;
}


function textWrapperDiamondDrill(textWrapper, video, videoOverlay) {
  let points = generateListOfPoints(textWrapper);
  for (var i = 0; i < points.length; i++) {
    ensureTextWrapperIsClickable(textWrapper, video, videoOverlay, points[i]);
  }
}


function generateListOfPoints(textWrapper) {
  const rect = textWrapper.getBoundingClientRect();

  let center = {
    top: (rect.top + rect.bottom) / 2,
    left: (rect.left + rect.right) / 2
  }

  let topLeft = {
    top: (rect.top + center.top) / 2,
    left: (rect.left + center.left) / 2,
  }

  let topRight = {
    top: (rect.top + center.top) / 2,
    left: (rect.right + center.left) / 2,
  }

  let bottomLeft = {
    top: (rect.bottom + center.top) / 2,
    left: (rect.left + center.left) / 2,
  }

  let bottomRight = {
    top: (rect.bottom + center.top) / 2,
    left: (rect.right + center.left) / 2,
  }

  let topMiddle = {
    top: (rect.top + 10),
    left: center.left
  }

  return [center, topLeft, topRight, bottomLeft, bottomRight, topMiddle];
}


/**
 * Set pointer-events none to all element that are blocking the center of the video from being clickable
 * @param {Element} textWrapper the HTML textWrapper element
 */
function ensureTextWrapperIsClickable(textWrapper, video, videoOverlay, point = null) {
  // Get the point in the center of video
  if (point === null) {
    point = {}
    const rect = textWrapper.getBoundingClientRect();
    point.top = (rect.top + rect.bottom) / 2;
    point.left = (rect.left + rect.right) / 2;
  }

  if (point.top == 0 || point.left == 0) {
    return;
  }


  // Ensure we don't get stuck in infinite loop from a bug
  const maxRemoveClick = 100;
  let i = 0;
  let $elem = "start";

  // Make sure the shadow host is there to avoid infinite loop
  if (getShadowHostForVideo(video).length === 0) {
    return
  }

  // Maintain a Jquery object of all the elements that we set pointer-events none on
  let blockingElements = []

  while ($elem === "start" || ($elem.length && i < maxRemoveClick)) {
    // Find the front element at the center of video
    $elem = $(document.elementFromPoint(point.left, point.top));

    // Dont stop click if it is the text wrapper
    if ($elem.is(textWrapper) || $elem.is(".selectextShadowHost") || $elem.is("video")) {
      textWrapper.style.pointerEvents = "auto";
      break;
    }

    // Stop the element in the way blocking clicks
    let initialPointerEvents = $elem.data("initalPointerEvents")
    if (!initialPointerEvents) {
      initialPointerEvents = $elem.css("pointer-events")
    }

    blockingElements.push({ el: $elem, pointerEventsInitial: initialPointerEvents });
    $elem.css("pointer-events", "none");

    // Set all children to pointer events auto if they haven't already been set to none
    $elem.find("*").each(function () {

      if (!this.style.pointerEvents || this.style.pointerEvents != "none") {
        let $this = $(this)
        if (!$this.data("initalPointerEvents")) {
          $this.data("initalPointerEvents", $this.css("pointer-events"));
        }
        this.style.pointerEvents = "auto";
      }
    });

    i++;

  }

  // Set pointer events back to auto on blocking elements when the video is resumed and when the video is paused just in case
  video.addEventListener("play", () => resetBlockingElementsToInitialPointerEvents(blockingElements), { once: true });
  let input = queryShadowRoot("#selecTextToggle", true, videoOverlay);
  input.change(
    (e) => {
      if (e.target.checked) {
        blockingElements.forEach(element => {
          element.el.css("pointer-events", "none");
        })
      } else {
        // If the toggle is turned off, make all the blocking elements clickable again
        resetBlockingElementsToInitialPointerEvents(blockingElements)
      }
    }
  )
}


function resetBlockingElementsToInitialPointerEvents(blockingElements) {
  blockingElements.forEach(element => {
    element.el.css("pointer-events", element.pointerEventsInitial);
  })
}


/**
 * Find the size of the black bars on the video. This is required for accurately drawing the text when the video
 * has black bars
 * @param {Element} video the HTML video element.
 * @return {Object} the int size (px) of the black bars on the top and left of the video
 */
function getBlackBarOffset(video) {
  // Ratio of the video's intrisic dimensions
  let videoRatio = video.videoWidth / video.videoHeight;
  // The width and height of the video element
  let width = video.offsetWidth;
  let height = video.offsetHeight;
  // The ratio of the element's width to its height
  let elementRatio = width / height;

  let left = 0;
  let top = 0;
  // If the video element is short and wide
  if (elementRatio > videoRatio) {
    left = (width - height * videoRatio) / 2;
  } else {
    top = (height - width / videoRatio) / 2;
  }

  return {
    leftOffset: left,
    topOffset: top,
  };
}

/**
 * Adds the drag select behaviour
 * @param {string} fullText the string off the full text returned by the vision API
 */
function enableDragSelect(textWrapper, videoOverlay) {
  let $textWrapper = $(textWrapper);

  const selectable = new Selectable({
    appendTo: $textWrapper.get(0)
  });
  selectable.on("end", () => processSelectedWords(selectable, videoOverlay));

  $textWrapper.click((e) => e.stopPropagation());
  $textWrapper.mousedown((e) => e.stopPropagation());
  $textWrapper.mouseup((e) => e.stopPropagation());
  return selectable;
}

function getBoundingBoxFromSelectableRect(rect) {
  return {
    top: rect.y1,
    left: rect.x1,
    bottom: rect.y2,
    right: rect.x2,
    height: rect.height,
    width: rect.width,
  }
}

function getAllSelectedBoxes(selectable) {
  const els = selectable.getSelectedItems();

  const boxes = []
  for (let i = 0; i < els.length; i++) {
    let elDict = {
      boundingBox: getBoundingBoxFromSelectableRect(els[i].rect),
      text: els[i].node.textContent,
      fontSize: els[i].node.style.fontSize,
    }
    boxes.push(elDict)
  }
  return boxes;
}


function getClosestBoxToOrigin(boxes) {
  let minTop = Infinity;
  let closestBox = null;
  let boxIndex = null;
  for (let i = 0; i < boxes.length; i++) {
    let box = boxes[i];
    let top = box.boundingBox.top;
    if (top < minTop) {
      minTop = top;
      closestBox = box;
      boxIndex = i;
    }
  }
  boxes.splice(boxIndex, 1);
  return closestBox;
}

function getAllBoxesOnSameLine(boxes, box) {
  let boxesOnSameLine = [box];
  let middleFifth = { top: box.boundingBox.top + (2 * box.boundingBox.height / 5), bottom: box.boundingBox.top + (3 * box.boundingBox.height / 5) };
  for (let i = boxes.length - 1; i >= 0; i--) {
    let otherBox = boxes[i];
    // If otherbox overlaps vertically with the middle third
    if ((otherBox.boundingBox.top < middleFifth.bottom && otherBox.boundingBox.bottom > middleFifth.top) || (otherBox.boundingBox.top > middleFifth.top && otherBox.boundingBox.bottom < middleFifth.bottom)) {
      boxesOnSameLine.push(otherBox);
      boxes.splice(i, 1);
    }
  }
  return boxesOnSameLine;
}


function sortBoxesOnSameLine(boxesOnSameLine) {
  return boxesOnSameLine.sort((a, b) => {
    return a.boundingBox.left - b.boundingBox.left;
  });
}

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function isSpaceBetweenBoxes(box1, box2) {
  const spaceBetweenBoxes = box2.boundingBox.left - box1.boundingBox.right;
  // To make it considered a space more often with lower value
  const toleranceFactor = 0.6;
  // To account for the border generally adding about 1px to the width of the boxes (should be 2 but meh)
  const toleranceConstant = 0;
  const spaceCharWidth = getTextWidth(" ", `${box1.fontSize} arial`)

  const spaceCharWidthScaled = (spaceCharWidth * toleranceFactor) - toleranceConstant;
  return spaceBetweenBoxes > spaceCharWidthScaled;
}

function isSpecialCharacter(box) {
  const specialCharacterRegex = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return (box.text.length == 1) && specialCharacterRegex.test(box.text);
}

function getTextStringFromSortedLineOfBoxes(sortedBoxesOnSameLine) {
  let text = "";
  for (let i = 0; i < sortedBoxesOnSameLine.length; i++) {
    let box = sortedBoxesOnSameLine[i];
    text += box.text;
    if (i < sortedBoxesOnSameLine.length - 1) {
      if ((isSpecialCharacter(sortedBoxesOnSameLine[i + 1]) || isSpecialCharacter(box)) && !isSpaceBetweenBoxes(box, sortedBoxesOnSameLine[i + 1])) {
        text += "";
      } else {
        text += " ";
      }
    } else {
      if (copyMode === "singleline") {
        text += " ";
      } else {
        text += "\n";
      }
    }
  }
  return text;
}


function generateFinalCopiedText(selectable) {
  let result = "";

  let boxes = getAllSelectedBoxes(selectable);
  while (boxes.length > 0) {
    let closestBox = getClosestBoxToOrigin(boxes);
    let boxesOnSameLine = getAllBoxesOnSameLine(boxes, closestBox);
    let sortedBoxesOnSameLine = sortBoxesOnSameLine(boxesOnSameLine);
    let lineOfText = getTextStringFromSortedLineOfBoxes(sortedBoxesOnSameLine)
    result += lineOfText;
  }

  return result.slice(0, -1);
}

function processSelectedWords(selectable, videoOverlay) {
  let result = generateFinalCopiedText(selectable);

  if (result !== "") {
    copyToClipboard(result);
    showFadingMessage(" Text copied", 2000, false, "images/copy-green.svg", videoOverlay);

    if (
      currentSelectionInfo !== undefined &&
      currentSelectionInfo.selections !== undefined
    ) {
      currentSelectionInfo.selections.push(result);
    }
  }
}

/**
 * Copies text to clipboard by creating a temporary hidden textArea
 * @param {string} result the text to be copied.
 */
function copyToClipboard(result) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(result).then(
      () => { }, (err) => copyToClipboardLegacy(result)
    )
  } else {
    copyToClipboardLegacy(result);
  }
}


function copyToClipboardLegacy(result) {
  if (!inIframe()) {
    var $temp = $("<textarea>");
    $("body").append($temp);
    $temp.val(result).select();
    document.execCommand("copy");
    $temp.remove();
  } else {
    // Send message to parent frame with result
    window.parent.postMessage({
      type: "SELECTEXT_IFRAME_COPY",
      text: result
    }, "*");
  }
}


/**
 * Show a fading alert message near the top of the Youtube video.
 * @param {string} text the text to be shown in the message
 * @param {int} milliseconds the number of milliseconds before the message fades out.
 * @param {boolean} comesBack whether the message shows again when the toggle is switched off and on
 * @param {string} iconPath the path to the icon image file to show on the left of the message
 */
function showFadingMessage(text, milliseconds, comesBack, iconPath, videoOverlay) {
  queryShadowRoot(".alertMessage", true, videoOverlay).remove();

  let $message = $(document.createElement("div"));
  $message.addClass("alertMessage");
  $message.click((event) => event.stopPropagation());

  let top
  if (videoIsFullscreen()) {
    top = 70
  } else {
    top = 20
  }

  // If the overlay is off the screen
  const overlayRect = videoOverlay.getBoundingClientRect()
  if (overlayRect.y < 0) {
    top -= overlayRect.y
  }

  $message.css("top", `${top}px`);

  if (iconPath) {
    let imgURL = browser.runtime.getURL(iconPath);
    let $icon = $(document.createElement("img"))
      .attr("src", imgURL)
      .css("display", "inline-block");

    $icon
      .css("width", "20px")
      .css("height", "20px")
      .css("vertical-align", "middle");
    $message.append($icon);
  }

  const fadingMessageText = document.createElement("div");
  fadingMessageText.className = "fadingMessageText";

  let textNode = document.createTextNode(text);
  fadingMessageText.appendChild(textNode);

  const $fadingMessageText = $(fadingMessageText);
  $message.append($fadingMessageText);
  $(videoOverlay).append($message);

  if (comesBack) {
    $message.attr("id", "persistentMessage");
  }
  setTimeout(() => {
    if (comesBack) {
      $message.fadeOut();
    } else {
      $message.fadeOut(() => {
        $message.remove();
      });
    }
  }, milliseconds);
}


function getResizeObserverForVideo(video) {
  const resizeObserverInfo = resizeObserverMap.get(video)
  if (resizeObserverInfo !== undefined) {
    return resizeObserverInfo.observer;
  }
  return undefined
}


/**
 * Add a resize observer that watches for a change in video size to resize the video overlay and optionally redraw the
 * text.
 * @param {Element} video the HTML video element.
 * @param {Element} videoOverlay the HTML video ovrlay element.
 * @param {Array} textAnnotations the array of JSON object representing the text nodes in the format returned by
 */
function addResizeObserver(
  video,
  videoOverlay,
  textAnnotations,
  videoPosition
) {
  const resizeObserver = getResizeObserverForVideo(video)
  if (resizeObserver !== undefined) {
    resizeObserver.disconnect();
  }

  let newResizeObserver;
  // If we have some detected text, redraw it as well as resizing the overlay
  if (textAnnotations) {
    newResizeObserver = new ResizeObserver(() => {
      const thisResizeObserverInfo = resizeObserverMap.get(video);
      const newFiredCount = thisResizeObserverInfo.firedCount + 1;
      resizeObserverMap.set(video, { observer: thisResizeObserverInfo.observer, firedCount: thisResizeObserverInfo.firedCount + 1 })
      if (newFiredCount === 1) {
        return;
      }
      setTimeout(() => {
        const resizeObserverInfoAfterTimeout = resizeObserverMap.get(video)
        if (resizeObserverInfoAfterTimeout === undefined) {
          return;
        }
        if (resizeObserverInfoAfterTimeout.firedCount !== newFiredCount) {
          return;
        }

        resizeVideoOverlay(video, videoOverlay);
        let textWrapper = queryShadowRoot("#textWrapper", false, videoOverlay);
        if (textWrapper !== null) {
          textWrapper.remove();
          drawText(video, videoOverlay, textAnnotations, videoPosition);
        }
      }, 400);
    })
  } else {
    let loader = queryShadowRoot("#selecTextLoader", false, videoOverlay);

    newResizeObserver = new ResizeObserver(() => {
      if (loader !== null) {
        resizeVideoOverlay(video, videoOverlay)
      } else {
        resizeVideoOverlay(video, videoOverlay, false)
      }
    }
    )
  }

  resizeObserverMap.set(video, { observer: newResizeObserver, firedCount: 0 })
  newResizeObserver.observe(video);
}

/**
 * Resize the video overlay to match the size of the video
 * @param {Element} video the HTML video element.
 * @param {Element} videoOverlay the HTML video overlay element.
 */
function resizeVideoOverlay(video, videoOverlay, size = true) {
  const $video = $(video);

  if (size === true) {
    videoOverlay.style.width = `${$video.width()}px`;
    videoOverlay.style.height = `${$video.height()}px`;
  }

  videoOverlay.style.zIndex = $video.css("z-index");

  videoOverlay.style.position = "absolute";

  $(videoOverlay).position({
    my: "left top",
    at: "left top",
    of: $video
  })
}


/**
 * An interaction with JQuery selectable and the UoA video players made the video resume when dragging into the bottom
 * bar of the video. Apply a hack to catch the click event.
 * @param {Element} textWrapper the text wrapper HTML element.
 */
function stopDragSelectResumingVideo(textWrapper, selectable) {
  textWrapper.addEventListener("mousedown", () => {
    //Hack to stop video resuming when drag select drags into bottom bar
    window.addEventListener(
      "click",
      stopProp,
      {
        capture: true,
        once: true
      }
    );

    const mouseupHandler = (e) => {
      // Will be undefined for iframe way
      if (e.stopPropagation !== undefined) {
        e.stopPropagation();
      }
      selectable._end(e)
      setTimeout(
        () => window.removeEventListener("click", stopProp, { capture: true, once: true }), 20
      )
    }

    // When using iframe the mouseup outside iframe is not detected to end the selection so need to use postmessage
    // For whatever reason it is fine in firefox but not in chrome
    if (!inIframe() || BROWSER_TYPE === "firefox") {
      window.addEventListener(
        "mouseup",
        mouseupHandler,
        {
          capture: true,
          once: true
        }
      )
    } else {
      // Send message to parent page to attach event listener
      window.parent.postMessage({
        type: "SELECTEXT_IFRAME_ATTACH_MOUSEUP_HANDLER",
        iframeSrc: window.location.href
      }, "*");
      // Handle response from parent page
      const handleMessage = (e) => {
        if (e.data.type === "SELECTEXT_IFRAME_MOUSEUP_HANDLER_FIRED" && e.data.event !== undefined) {
          mouseupHandler(e.data.event)
          window.removeEventListener(
            "mouseup",
            mouseupHandler,
            {
              capture: true,
              once: true
            }
          )
        }
      }
      window.addEventListener(
        "message",
        handleMessage,
        { once: true }
      )

      // Note: ideally we clean up mouseup click blocker on parent page here but not worth it
      window.addEventListener(
        "mouseup",
        mouseupHandler,
        {
          capture: true,
          once: true
        }
      )
    }
  });

}


function stopProp(e) {
  e.stopPropagation()
}


/**
 * Remove existing generated text and reset the toggle to false when we scrub the video
 * @param {Element} video the HTML video element.
 * @param {Element} toggle the HTML input element in the toggle.
 */
function onScrubWhilePaused(video, videoOverlay) {
  if (video.paused) {

    const textWrapper = queryShadowRoot("#textWrapper", false, videoOverlay);

    if (textWrapper !== null) {
      textWrapper.remove();
      sendAndResetCurrentSelectionInfo();
    }

    const loader = queryShadowRoot("#selecTextLoader", false, videoOverlay);
    if (loader !== null) {
      loader.remove();
    }

    const comesBackMsg = queryShadowRoot("#persistentMessage", false, videoOverlay);
    if (comesBackMsg !== null) {
      comesBackMsg.remove();
    }

    const toggle = queryShadowRoot("#selecTextToggle", false, videoOverlay);
    if (toggle !== null) {
      toggle.checked = false;
    }

    const loginWrapper = queryShadowRoot(".selectextLoginWrapper", false, videoOverlay);
    if (loginWrapper !== null) {
      loginWrapper.remove();
    }
  }
}


/**
 * Move the toggle down on fullscreen so the video header isnt blocking it.
 * @param {HTMLElement} toggle optionally the corner wrapper html Element
 */
function adjustTogglePos(toggle, video, videoOverlay) {
  if (toggle === undefined) {
    toggle = queryShadowRoot("#cornerWrapper", false, videoOverlay);
  }
  if (toggle !== null && toggle !== undefined) {
    let top;
    if (videoIsFullscreen() || inIframe()) {
      top = 100;
    } else {
      top = 10;
    }

    // If the overlay is off the screen
    const overlayRect = video.getBoundingClientRect()

    if (overlayRect.y < 0 && overlayRect.bottom > 0) {
      top -= overlayRect.y
    }

    toggle.style.top = `${top}px`

    toggle.style.left = "10px";
  }
}

/**
 * @returns {boolean} whether the video is fullscreen
 */
function videoIsFullscreen() {
  return (screen.availHeight || screen.height - 30) <= window.innerHeight
}



/**
 * Initialise the current selection info object
 */
function initCurrentSelectionInfo(timeOfButtonPress, detectedLanguages) {
  currentSelectionInfo = {
    URL: window.location.href,
    selections: [],
    timeOfButtonPress: timeOfButtonPress,
    browser: BROWSER_TYPE,
    detectedLanguages: detectedLanguages,
    version: browser.runtime.getManifest().version
  };
}

/**
 * Send the current selection info to the background script to be logged via the selectext API
 */
function sendAndResetCurrentSelectionInfo() {
  if (currentSelectionInfo !== undefined) {
    browser.runtime.sendMessage({
      currentSelectionInfo: currentSelectionInfo,
    });
  }

  currentSelectionInfo = undefined;
}

/**
 * When the background script or popup notifies the content script, handle the event
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.activeColour !== undefined) {
    setColour(request.activeColour);
    return;
  }

  if (request.pause !== undefined && request.pause === true) {
    onPauseFromPopup();
  }

  if (request.resume !== undefined && request.resume === true) {
    onResumeFromPopup();
  }

  if (request.isSelectextPaused !== undefined && request.isSelectextPaused === true) {
    sendResponse({ "isPaused": isPaused });
  }

  if (request.copyMode !== undefined) {
    copyMode = request.copyMode;
  }
});


function onPauseFromPopup() {
  isPaused = true;

  // Remove existing overlays
  $(".selectextShadowHost").remove();

  // Remove event listeners
  let videos = document.getElementsByTagName("video");
  for (let i = 0; i < videos.length; i++) {
    removeVideoEventListeners(videos[i]);
  }

  // Unbind arrive
  Arrive.unbindAllArrive();

  // Disconnect all resize observers
  for (let resizeObserverInfo of resizeObserverMap.values()) {
    resizeObserverInfo.observer.disconnect();
  }
  resizeObserverMap.clear()
}


function onResumeFromPopup() {
  isPaused = false;
  findVideo(true);
}


async function captureVideoFrame(videoPosition, viewportDimensions, quality, dataURI) {
  return new Promise((resolutionFunc, rejectionFunc) => {
    // Create off screen image with dataURL as source
    var img = new Image;

    img.onload = () => {
      // create an off-screen canvas
      var canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');

      // The relative size of the window vs the screenshot to fe the cropping dimensions
      const scaleFactor = img.width / viewportDimensions.width;
      const scaleFactorY = scaleFactor;

      const width = videoPosition.width * scaleFactor;
      const height = videoPosition.height * scaleFactorY;

      const topOffset = videoPosition.top * scaleFactorY;
      const leftOffset = videoPosition.left * scaleFactor;

      // set its dimension to video size
      canvas.width = videoPosition.width
      canvas.height = videoPosition.height;

      // draw video frame into the off-screen canvas
      ctx.drawImage(img, leftOffset, topOffset, width, height, 0, 0, videoPosition.width, videoPosition.height);

      // encode image to data-uri with base64 version of compressed image
      const croppedDataURI = canvas.toDataURL("image/jpeg", quality);

      // Remove the format part at the start of the dataURI as google accepts this
      const trimmedCroppedDataUri = croppedDataURI.substring(dataURI.indexOf(",") + 1);

      resolutionFunc(trimmedCroppedDataUri)
    }

    img.src = dataURI;
  }
  );
}


/**
 * Show the popup over the video that prompts the user to sign in
 */
function showLoginPopup(videoOverlay, video) {
  if (queryShadowRoot(".selectextLoginWrapper", true, videoOverlay).length > 0) {
    return;
  }
  const loginPage = browser.runtime.getURL("login.html");

  const $loginWrapper = $('<div class="selectextLoginWrapper"></div>');

  $loginWrapper
    .appendTo($(videoOverlay))
    .load(loginPage, onLoginLoaded);

  $loginWrapper.click((e) => e.stopPropagation());
  $loginWrapper.mousedown((e) => e.stopPropagation());
  $loginWrapper.mouseup((e) => e.stopPropagation());

  queryShadowRoot("#selecTextLoader", true, videoOverlay).remove();

  setTimeout(
    () => loginWrapperDiamondDrill($loginWrapper, video, videoOverlay), 200
  )

}

function loginWrapperDiamondDrill(loginWrapper, video, videoOverlay) {
  const loginButton = loginWrapper.find(".selectextLoginWithGoogleButton").get(0);
  const helpButton = loginWrapper.find(".selectextHelpButton").get(0);
  const whyButton = loginWrapper.find(".selectextWhyButton").get(0);

  if (loginButton !== undefined) {
    ensureTextWrapperIsClickable(loginButton, video, videoOverlay);
  }

  if (helpButton !== undefined) {
    ensureTextWrapperIsClickable(helpButton, video, videoOverlay);
  }

  if (whyButton !== undefined) {
    ensureTextWrapperIsClickable(whyButton, video, videoOverlay);
  }
}


/**
 * Add the loading spinner to the videoOverlay
 * @returns The spinner HTML element
 */
function addSpinner(videoOverlay) {
  //Add a loading spinner to the center of the overlay
  spinner = $("<div id='selecTextLoader'></div>").appendTo(
    $(videoOverlay)
  );
  spinner.hide()

  setTimeout(
    () => {
      spinner.show()
    }, 150
  )

  return spinner
}

/**
 * Detect if we are currently running in an iFrame
 * @returns true if in iframe, otherwise false
 */
function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}


async function isSelectextEnabled() {
  let siteName;
  if (!inIframe()) {
    siteName = getSiteNameFromURL(window.location.href);
  } else {
    let url = await getURLofParentPage();

    if (url === null) {
      return false
    }
    siteName = getSiteNameFromURL(url);
  }

  if (siteName === null) {
    return false;
  }

  let key = `pause_${siteName}`;

  let result = await browser.storage.sync.get(key)

  if (result[key] !== undefined && result[key] === true) {
    return false;
  }

  return true;
}

function getURLofParentPage() {
  return new Promise((resolutionFunc, rejectionFunc) => {
    let onIframeURLResponse = (e) => {

      if (e.data.type == "SELECTEXT_URL_RESPONSE") {

        resolutionFunc(e.data.url);
        window.removeEventListener("message", onIframeURLResponse);
      }
    }
    setTimeout(() => {
      window.addEventListener("message", onIframeURLResponse);

      window.top.postMessage({
        type: "SELECTEXT_IFRAME_URL_REQUEST",
        iframeSrc: window.location.href
      }, "*")

      setTimeout(
        () => {
          window.removeEventListener("message", onIframeURLResponse);
          resolutionFunc(null);
        }, 500
      )
    }, 500)
  })

}