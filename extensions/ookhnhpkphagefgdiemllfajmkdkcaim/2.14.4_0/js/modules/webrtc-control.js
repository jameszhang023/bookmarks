"use strict"

const webRTCcontrol = (function() {

    var init = function() {
        console.log('ok');
        chrome.privacy.network.webRTCNonProxiedUdpEnabled.set({ value: false, scope: 'regular' });
    };

    return {
        init
    };
})();

webRTCcontrol.init();
