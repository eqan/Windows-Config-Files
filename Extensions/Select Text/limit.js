function onLimitLoaded(limit, planIsFree) {
    // Timeout as there is small lag in shadowDOM after load fired
    setTimeout(
        () => {
            queryShadowRoot(".selectextLimitLogo").attr("src", browser.runtime.getURL("images/selectext-logo-filled.png"))
            queryShadowRoot(".limitAmount").text(limit)
            if (!planIsFree) {
                queryShadowRoot(".freeText").text(" your")
                queryShadowRoot(".switchPlanText").text("switch plan")
                queryShadowRoot(".switchPlanTextUpper").text("Switch plan")
            }
            queryShadowRoot(".upgradeButton").click(upgradeButtonClick)
        }, 50
    )
}


function upgradeButtonClick() {
    browser.runtime.sendMessage({ upgradeInNewTab: true })
}