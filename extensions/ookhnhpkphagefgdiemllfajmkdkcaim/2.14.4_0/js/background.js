"use strict";

class Background {
    constructor() {
        this._feedback = new Feedback();
        this._nextReconnect = {};
	      this._resetProxySettings();
        this._checkUpdate();
        this._init();
        this._intervalAuthForApp();

        chrome.proxy.onProxyError.addListener(this._onProxyError.bind(this));
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { });

        this._linkTimeoutWorkProxy = null;

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if(request.msg == 'runTimeoutProxy')
              this._runTimeoutWorkProxy(180);
            else if(request.msg == 'clearTimeoutProxy')
              clearTimeout(this._linkTimeoutWorkProxy);
        });
    }

    async _init() {
        this._feedback.init({
            delayDays: 3,
            delayMinutesAfter: 180
        });
    }

    _checkUpdate() {
        chrome.runtime.requestUpdateCheck(() => { });
        chrome.runtime.onSuspend.addListener(chrome.runtime.reload);
        chrome.runtime.onUpdateAvailable.addListener(chrome.runtime.reload);
    }

    _onProxyError(details) {
        if(!navigator.onLine)
            return;

        chrome.storage.local.get(['proxyServer'], function(items) {
          details.proxyServer = items.proxyServer;
          console.error(details, 'proxy-error');
        });

        if(!authXHR)
            chrome.storage.local.get([ 'proxyServer', 'proxyPort' ], (items) => {
                var time = (new Date()).getTime();

                if(this._nextReconnect[items.proxyServer] && this._nextReconnect[items.proxyServer] > time)
                    return;

                this._nextReconnect[items.proxyServer] = time + 900000;
                authToServer(items, false, true);
            });
    }

    _intervalAuthForApp() {
        setInterval(() => {
            chrome.storage.local.get([ 'proxyServer', 'proxyPort' ], function(items) {
                authToServer(items, false, true);
            });
        }, 1800000)
    }

    _resetProxySettings() {
        chrome.storage.local.get(['isAutoStart', 'proxyServer', 'proxyPort'], function(items) {
            if(items.isAutoStart) {
                onProxy(items);
                authToServer(items, false, true);
            } else {
                resetProxySettings();
            }
        });

    }

    _runTimeoutWorkProxy(timeWait) {
        clearTimeout(this._linkTimeoutWorkProxy);

        this._linkTimeoutWorkProxy = setTimeout(() => {
          this._resetProxySettings();

          var manifest = chrome.runtime.getManifest();
          chrome.notifications.create('ProxySessionComplete', {
              type: 'basic',
              iconUrl: manifest.icons['128'],
              title: manifest.name,
              message: 'Proxy Session Complete\nSession Time 3 Hours.',
              isClickable: false,
              requireInteraction: false
          }, () => {});
        }, 1000 * 60 * timeWait);
    }
}

const background = new Background();
