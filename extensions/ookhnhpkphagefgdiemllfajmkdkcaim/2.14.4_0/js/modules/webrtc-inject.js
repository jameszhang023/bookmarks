var inj = (function(o) {
    console.log('inject2', o);
    var script = document.getElementById("webrtc-control");
    var head = document.documentElement || document.head || document.querySelector("head");
    if (!script) {
        script = document.createElement('script');
        script.type = "text/javascript";
        script.setAttribute("id", "webrtc-control");
        if (head) head.appendChild(script);
    }
    if (o.inject && o.state === "enabled") {
        try {
            var webrtc = '(' + function() {
                if (typeof navigator.getUserMedia !== "undefined") navigator.getUserMedia = undefined;
                if (typeof window.MediaStreamTrack !== "undefined") window.MediaStreamTrack = undefined;
                if (typeof window.RTCPeerConnection !== "undefined") window.RTCPeerConnection = undefined;
                if (typeof window.RTCSessionDescription !== "undefined") window.RTCSessionDescription = undefined;
                if (typeof navigator.mozGetUserMedia !== "undefined") navigator.mozGetUserMedia = undefined;
                if (typeof window.mozMediaStreamTrack !== "undefined") window.mozMediaStreamTrack = undefined;
                if (typeof window.mozRTCPeerConnection !== "undefined") window.mozRTCPeerConnection = undefined;
                if (typeof window.mozRTCSessionDescription !== "undefined") window.mozRTCSessionDescription = undefined;
                if (typeof navigator.webkitGetUserMedia !== "undefined") navigator.webkitGetUserMedia = undefined;
                if (typeof window.webkitMediaStreamTrack !== "undefined") window.webkitMediaStreamTrack = undefined;
                if (typeof window.webkitRTCPeerConnection !== "undefined") window.webkitRTCPeerConnection = undefined;
                if (typeof window.webkitRTCSessionDescription !== "undefined") window.webkitRTCSessionDescription = undefined;
            } + ')();';
            script.textContent = webrtc;
        } catch (e) {}
    } else script.textContent = '';

    return this;
})({
    inject: true,
    state: 'enabled'
});
