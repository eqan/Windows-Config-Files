/**
 * When the login UI has loaded, attach event listeners
 */
function onLoginLoaded() {
    // Timeout as there is small lag in shadowDOM after load fired
    setTimeout(
        () => {
            queryShadowRoot(".selectextLoginWithGoogleButton").attr("src", browser.runtime.getURL("images/google-sign-in.png"));
            queryShadowRoot(".selectextLoginLogo").attr("src", browser.runtime.getURL("images/selectext-logo-filled.png"))

            queryShadowRoot(".selectextLoginWithGoogleButton").click(loginInNewTab)

            queryShadowRoot(".selectextHelpButton").click(
                toggleHelpButton
            )

            queryShadowRoot(".selectextWhyButton").click(
                toggleWhyButton
            )
        }, 50
    )

}

function loginInNewTab() {
    browser.runtime.sendMessage({ loginInNewTab: true })
}

function toggleHelpButton() {
    queryShadowRoot(".selectextHelpMessageWrapper").toggle()
    queryShadowRoot(".selectextWhyMessageWrapper").hide()
}

function toggleWhyButton() {
    queryShadowRoot(".selectextWhyMessageWrapper").toggle()
    queryShadowRoot(".selectextHelpMessageWrapper").hide()
}
