/**
 * Listen for specific messages from the page (selectext.app)
 */
window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
        return;

    if (event.data.type) {
        if (event.data.type === "SELECTEXT_SIGN_IN_SUCCESS") {
            notifyBackgroundScriptOfSignInSuccess()
        }
    }
});


/**
 * Notify the background script that the sign in via the website was a success.
 */
function notifyBackgroundScriptOfSignInSuccess() {
    browser.runtime.sendMessage({loginComplete: true})
}
