(function() {
    'use strict';

    if (window.injectionStarted != true) {
        const appStoreIconTitle = document.getElementsByClassName("platform-selector-container")[0];
        const appStoreSideBarSeparator = document.getElementsByClassName("platform-selector-inline svelte-8pxmff")[0];

        window.appModifyActive = false
        window.currentAppInstalled = false
        window.modifyApp = []
        window.installedApps = []

        function requestOutdatedApps() {
            window.electronAPI.messageToMain('get-outdated')
            getOutdatedAppsButton.innerHTML = "Checking"
            getOutdatedAppsButton.disabled = true
        }

        function upgradeAllApps() {
            window.electronAPI.messageToMain("upgrade-outdated")
            upgradeAllAppsButton.innerHTML = "Upgrading"
            upgradeAllAppsButton.disabled = true
        }

        function doViewReset() {
            try {
                if (!appStoreSideBarSeparator.innerHTML.includes("View Installed Apps")) {
                    appStoreSideBarSeparator.innerHTML = "<p></p>"
                }
                if (!document.getElementById("traffic-light-indent")) {
                    var trafficLightIndentDiv = document.createElement('div');
                    trafficLightIndentDiv.style = "height: 20px;"
                    trafficLightIndentDiv.id = "traffic-light-indent"
                    appStoreIconTitle.before(trafficLightIndentDiv);
                }
                if (!document.getElementById("getOutdatedAppsButton")) {
                    var getOutdatedAppsButton = document.createElement('button');
                    getOutdatedAppsButton.id = "getOutdatedAppsButton"
                    getOutdatedAppsButton.innerHTML = "Check for Updates"
                    getOutdatedAppsButton.style = "background-color: #3478f7; color: white; padding-top: 5px; padding-bottom: 5px; padding-right: 10px; padding-left: 10px; margin: 5px; margin-left: 25px; border-radius: 5px;"
                    getOutdatedAppsButton.classList = "svelte-8pxmff"
                    getOutdatedAppsButton.onclick = requestOutdatedApps;
                    appStoreSideBarSeparator.before(getOutdatedAppsButton);
                }
                if (!document.getElementById("upgradeSepartor")) {
                    var upgradeSepartor = document.createElement('div');
                    upgradeSepartor.id = "upgradeSepartor"
                    upgradeSepartor.style = "height: 5px;"
                    appStoreSideBarSeparator.before(upgradeSepartor);
                }
                if (!document.getElementById("upgradeAllAppsButton")) {
                    var upgradeAllAppsButton = document.createElement('button');
                    upgradeAllAppsButton.id = "upgradeAllAppsButton"
                    upgradeAllAppsButton.innerHTML = "Upgrade All Apps"
                    upgradeAllAppsButton.style = "background-color: #3478f7; color: white; padding-top: 5px; padding-bottom: 5px; padding-right: 10px; padding-left: 10px; margin: 5px; margin-left: 25px; border-radius: 5px;"
                    getOutdatedAppsButton.classList = "svelte-8pxmff"
                    upgradeAllAppsButton.onclick = upgradeAllApps;
                    appStoreSideBarSeparator.before(upgradeAllAppsButton);
                }
                if (!document.getElementById("listInstalledApps")) {
                    var listInstalledApps = document.createElement('h3');
                    listInstalledApps.id = "listInstalledApps"
                    listInstalledApps.className = "svelte-8pxmff"
                    listInstalledApps.style = "margin-left: 25px;"
                    listInstalledApps.textContent = "View Installed Apps"
                    listInstalledApps.onclick = () => {
                        window.electronAPI.messageToMain(`getInstalledAppsText`)
                    }
                    appStoreSideBarSeparator.before(listInstalledApps);
                }
            } catch (error) {

            }

            try {
                document.getElementsByClassName("svelte-1hs3qpl")[0].innerHTML = ""
            } catch (error) {}
        }

        function extractAppId(url) {
            const parts = url.split('/id');
            return parts[1]?.split('?')[0] || null;
        }

        function changeAppInstallSet() {
            if (!window.appModifyActive) {
                try {
                    var appInstallButton = document.getElementsByClassName("get-button blue svelte-xi2f74")[0]
                    appInstallButton.disabled = false
                    if (window.currentAppInstalled) {
                        appInstallButton.innerHTML = "Uninstall"
                        appInstallButton.style = "background-color: #f7675a; color: white;"
                    } else {
                        appInstallButton.innerHTML = "Install"
                        appInstallButton.style = ""
                    }
                } catch (error) {}
            }
        }

        function displayInstallingText() {
            window.appModifyActive = true
            try {
                localStorage.setItem('currentAppModify', String(extractAppId(window.location.href)))
                localStorage.setItem('currentAppModifyAction', "install")
                var appInstallButton = document.getElementsByClassName("get-button blue svelte-xi2f74")[0]
                appInstallButton.innerHTML = "Installing"
                appInstallButton.disabled = true
            } catch (error) {}
        }

        function displayUninstallingText() {
            window.appModifyActive = true
            try {
                localStorage.setItem('currentAppModify', String(extractAppId(window.location.href)))
                localStorage.setItem('currentAppModifyAction', "uninstall")
                var appInstallButton = document.getElementsByClassName("get-button blue svelte-xi2f74")[0]
                appInstallButton.style = "background-color: #f7675a; color: white;"
                appInstallButton.innerHTML = "Uninstalling"
                appInstallButton.disabled = true
            } catch (error) {}
        }

        function displayOtherAppModifyingText() {
            window.appModifyActive = true
            try {
                var appInstallButton = document.getElementsByClassName("get-button blue svelte-xi2f74")[0]
                appInstallButton.style = "background-color: #9e9e9e; color: white;"
                appInstallButton.innerHTML = "Another App is Being Modified"
                appInstallButton.disabled = true
            } catch (error) {}
        }

        function firstLaunch() {
            localStorage.clear()
        }

        function upgradeComplete() {
            upgradeAllAppsButton.innerHTML = "Upgraded"
            upgradeAllAppsButton.disabled = true
            upgradeAllAppsButton.style = "background-color: #4caf50; color: white; padding-top: 5px; padding-bottom: 5px; padding-right: 10px; padding-left: 10px; margin: 5px; margin-left: 25px; border-radius: 5px;"
            setTimeout(() => {
                upgradeAllAppsButton.style = "background-color: #3478f7; color: white; padding-top: 5px; padding-bottom: 5px; padding-right: 10px; padding-left: 10px; margin: 5px; margin-left: 25px; border-radius: 5px;"
                upgradeAllAppsButton.innerHTML = "Upgrade All Apps"
                upgradeAllAppsButton.disabled = false
            }, 7500);
        }

        window.electronAPI.receiveMessage((data) => {
            switch (data) {
                case 'app-installing':
                    displayInstallingText()
                    break;
                case 'app-uninstalling':
                    displayUninstallingText()
                    break;
                case 'app-installed':
                    window.appModifyActive = false
                    break;
                case 'app-uninstalled':
                    window.appModifyActive = false
                    break;
                case 'first-launch':
                    firstLaunch()
                    break;
                case 'upgrade-complete':
                    upgradeComplete()
                    break;
                default:
                    break;
            }
        });

        window.electronAPI.outdatedMessage((data) => {
            alert(data)
            getOutdatedAppsButton.innerHTML = "Check for Updates"
            getOutdatedAppsButton.disabled = false
            getOutdatedAppsButton.style = "background-color: #3478f7; color: white; padding-top: 5px; padding-bottom: 5px; padding-right: 10px; padding-left: 10px; margin: 5px; margin-left: 25px; border-radius: 5px;"
        })

        window.electronAPI.installedMessage((data) => {
            loadInstalledStatus(data)
        })

        window.electronAPI.modifyMessage((data) => {
            loadModifyingApp(data)
        })

        window.electronAPI.installedTextMessage((data) => {
            alert(data)
        })

        function loadInstalledStatus(data) {
            window.installedApps = data
        }

        function loadModifyingApp(data) {
            window.modifyApp = data
        }

        function setInstalledStatus() {
            if (window.location.href.includes("/id") && window.location.href.includes("/app/")) {
                if (window.modifyApp[0] === extractAppId(window.location.href)) {
                    displayInstallingText()
                } else if (window.modifyApp[1] === extractAppId(window.location.href)) {
                    displayUninstallingText()
                } else {
                    if (String(window.modifyApp) != ',') {
                        window.appModifyActive = true
                        displayOtherAppModifyingText()
                    } else {
                        window.appModifyActive = false
                        if (window.installedApps.includes(extractAppId(window.location.href))) {
                            window.currentAppInstalled = true
                        } else {
                            window.currentAppInstalled = false
                        }
                    }
                }
            }
        }

        function ensureMacVersion() {
            if (window.location.href.includes("/iphone/") || window.location.href.includes("/ipad/") || window.location.href.includes("/vision/") || window.location.href.includes("/watch/") || window.location.href.includes("/tv/")) {
                window.location.href = window.location.href.replace("/iphone/", "/mac/").replace("/ipad/", "/mac/").replace("/vision/", "/mac/").replace("/watch/", "/mac/").replace("/tv/", "/mac/")
            }
        }

        async function repeatProcess() {
            doViewReset()
            changeAppInstallSet()
            setInstalledStatus()
            ensureMacVersion()
        }

        setInterval(() => {
            repeatProcess()
        }, 175);

        window.injectionStarted = true
    }
})();