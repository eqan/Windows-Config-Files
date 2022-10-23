
if (!inIframe()) {

    window.addEventListener("message", function (event) {        
        if (event.data !== undefined && event.data.type !== undefined) {
            if (event.data.iframeSrc !== undefined) {
                const iframe = $(`iframe[src*='${event.data.iframeSrc}']`).get(0);

                if (iframe !== undefined) {
                    if (event.data.type === "SELECTEXT_IFRAME_DIMENSIONS_REQUEST") {
                        returnIframeDimensions(iframe);
                    }

                    if (event.data.type === "SELECTEXT_IFRAME_URL_REQUEST") {
                        returnPageURL(iframe);
                    }

                    if (event.data.type === "SELECTEXT_IFRAME_ATTACH_MOUSEUP_HANDLER") {
                        const mouseupHandler = (e) => {
                            e.stopPropagation()
                            const iframeDimensions = iframe.getBoundingClientRect();
                            const eventCoordsOnly = _.pick(e, ["clientX", "clientY"]);
                            eventCoordsOnly.clientX = eventCoordsOnly.clientX - iframeDimensions.left;
                            eventCoordsOnly.clientY = eventCoordsOnly.clientY - iframeDimensions.top;
                            iframe.contentWindow.postMessage({
                                type: "SELECTEXT_IFRAME_MOUSEUP_HANDLER_FIRED",
                                event: eventCoordsOnly
                            }, "*");
                        }
        
                        window.addEventListener(
                            "mouseup",
                            mouseupHandler,
                            {
                                capture: true,
                                once: true
                            }
                        )
                    }
                }
            }

            if (event.data.type === "SELECTEXT_IFRAME_COPY") {
                copyToClipboard(event.data.text);
            }

            
        }
    });

    function returnIframeDimensions(iframe) {
        const iframeDimensions = iframe.getBoundingClientRect();
        const viewportDimensions = getViewportDimensions();
        iframe.contentWindow.postMessage({
            type: "SELECTEXT_IFRAME_DIMENSIONS_RESPONSE",
            iframeDimensions: iframeDimensions,
            viewportDimensions: viewportDimensions
        }, "*");
    }

    function returnPageURL(iframe) {
        iframe.contentWindow.postMessage({
            type: "SELECTEXT_URL_RESPONSE",
            url: window.location.href
        }, "*");
    }
}
