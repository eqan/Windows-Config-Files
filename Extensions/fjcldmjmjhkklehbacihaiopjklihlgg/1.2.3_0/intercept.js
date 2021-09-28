(function () {
    'use strict';

    const paths = ['', '/'];
    function isEnabled() {
        return paths.indexOf(window.location.pathname) > -1;
    }

    /**
     * Intercept the scroll event and kill it to prevent the
     * infinite scroll algorithm triggering.
     */
    // Check if the event target is a chat conversation
    let isConversation = target => {
        if (!target || !target.matches) {
            return false;
        }
        if (target.matches('.conversation') || target.matches('#ChatTabsPagelet')) {
            return true;
        }
        if (!target.parentNode) {
            return false;
        }
        return isConversation(target.parentElement);
    };
    const maybeBlock = (event) => {
        if (!isEnabled()) {
            return false;
        }
        // Allow infinite scrolling of chats on the home page
        if (isConversation(event.target)) {
            return false;
        }
        event.stopImmediatePropagation();
        return true;
    };
    function disableInfiniteScroll () {
        window.addEventListener('scroll', maybeBlock, true);
        window.addEventListener('mousewheel', maybeBlock, true);
    }

    // Unforunately the browser provides no native way to observe route changes initiated
    // by the page. The `popstate` event only observes browser initiated back/forward events.
    // So, we resort to this hack: checking the document URL every n milliseconds, to see if
    // it's changed.
    // NB: I also tried monkey patching history.pushState to intercept the calls, but that
    // had no effect.
    const CHECK_INTERVAL = 1000;
    let lastPath = undefined;
    let element = document.querySelector('html');
    function setupRouteChange() {
        const onChange = () => {
            if (isEnabled()) {
                element.dataset.nfeEnabled = 'true';
            }
            else {
                // Delay showing the feed when switching pages, sometimes it can appear
                // before the page has switched
                setTimeout(() => {
                    element.dataset.nfeEnabled = 'false';
                }, 1000);
            }
        };
        let timer = undefined;
        const checkIfLocationChanged = () => {
            let path = document.location.pathname;
            if (path != lastPath) {
                lastPath = path;
                onChange();
            }
            if (timer != null) {
                clearTimeout(timer);
            }
            timer = setTimeout(checkIfLocationChanged, CHECK_INTERVAL);
        };
        window.addEventListener('popstate', checkIfLocationChanged);
        checkIfLocationChanged();
    }

    /**
     * This script should run at document start to set up
     * intercepts before FB loads.
     */
    disableInfiniteScroll();
    setupRouteChange();

}());
