var authXHR = null;
var authTimeoutLink = null;

// load language
function loadLang()  {
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];
        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });
        if(valNewH != valStrH)
            obj.innerHTML = valNewH;
    }
}

// load settings
function loadSettings() {
    chrome.storage.local.get([ 'proxyIsWork', 'proxyServer', 'proxyPort' ], function(items)  {
        // set status
        $('#btn-on-off').prop("checked", items.proxyIsWork);
        if(items.proxyIsWork) {
            $('#btn-on-off').next().addClass('slider-green');
            $('#proxy-server option[value*="' + items.proxyServer + '"]').attr('selected', 'selected');
        }
    });
}

// use proxy settings
function useProxySettings(proxyServer, proxyPort, whiteList) {
    chrome.storage.local.get(['whiteList'], function(items) {
        setProxySettings(proxyServer, proxyPort, items.whiteList);
    });
}

function setProxySettings(proxyServer, proxyPort, whiteList) {
    console.log(proxyServer, proxyPort)
    var config = {
        mode: "pac_script",
        pacScript: {
            data: `function FindProxyForURL(url, host) {
                var servers = ${JSON.stringify(AUTH_SERVERS)};
                var whiteList = ${JSON.stringify(whiteList)};

                if(servers.indexOf(host) != -1 || dnsDomainIs(host, 'ip-api.com'))
                    return 'system';

                if (isPlainHostName(host) || dnsDomainLevels(host) == 0 ||
                    shExpMatch(host, "*.local") || shExpMatch(host, "localhost") ||
                    isInNet(dnsResolve(host), "10.0.0.0", "255.0.0.0") ||
                    isInNet(dnsResolve(host), "172.16.0.0",  "255.240.0.0") ||
                    isInNet(dnsResolve(host), "192.168.0.0",  "255.255.0.0") ||
                    isInNet(dnsResolve(host), "127.0.0.0", "255.255.255.0"))
                    return 'system';

                if(whiteList && whiteList.length > 0 && whiteList.indexOf(host.replace(/^www\./,'')) == -1)
                    return 'system';

                return 'socks5 ${proxyServer}:${proxyPort}';
            }`
        }
    };

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, function() { });
    // disable webRTC connect
    setWebRTCNonProxiedUdpEnabled(false);
}

// reset proxy settings
function resetProxySettings() {
    var deferred = $.Deferred();

    if(authXHR)
        authXHR.abort();

    clearTimeout(authTimeoutLink);

    // reset proxy config
    chrome.proxy.settings.set({
            value: {
                mode: "system"
            },
            scope: 'regular'
        },
        function () {
            deferred.resolve();
        }
    );

    // enable webRTC connect
    setWebRTCNonProxiedUdpEnabled(true);

    // set status
    chrome.storage.local.set({ proxyIsWork: false }, function() { });

    // set icon
    chrome.browserAction.setIcon({ path: 'img/icon64-gray.png' });

    $('.loader img').hide();
    $('#btn-on-off')
        .prop('disabled', false).prop('checked', false)
        .next().removeClass('slider-green');

    chrome.runtime.sendMessage({ msg: 'clearTimeoutProxy' });

    return deferred.promise();
}

function setWebRTCNonProxiedUdpEnabled(value) {
    if (chrome.privacy && chrome.privacy.network && chrome.privacy.network.webRTCNonProxiedUdpEnabled)
        chrome.privacy.network.webRTCNonProxiedUdpEnabled.set({ value: value, scope: 'regular' });
}

// change status
function onProxy(items) {
    items.proxyIsWork = true;
    useProxySettings(items.proxyServer, items.proxyPort);

    // set data
    $('#btn-on-off').prop("checked", true);
    $('#proxy-server option[value="' + items.proxyServer +':' + items.proxyPort + '"]').attr('selected', 'selected');

    // set icon
    chrome.browserAction.setIcon({
        path: 'img/icon64.png'
    });

    // save options
    chrome.storage.local.set(items, function() { });

    chrome.runtime.sendMessage({ msg: 'runTimeoutProxy' });
}

// auth to server
function authToServer(items, serverId, isProxyOn) {
    serverId = serverId ? serverId : 0;
    var serverResult = null;
    authXHR = $.ajax({
        url: 'http://' + AUTH_SERVERS[serverId] + '/api/auth/' + items.proxyServer,
        method: 'GET',
        timeout: 15000,
        success: function (data) {
            console.log('Result auth to server: ' + AUTH_SERVERS[serverId]);
            try {
                serverResult = JSON.parse(data);
                if(serverResult.result == 'true') {
                    $('#btn-on-off').next().addClass('slider-green');
                    if(!isProxyOn)
                        onProxy(items);
                } else if(serverId != 2) {
                    authToServer(items, serverId + 1, isProxyOn);
                } else {
                  resetProxySettings();
                }
            } catch (e) {
                if(serverId != 2)
                    authToServer(items, serverId + 1, isProxyOn);
                else
                  resetProxySettings();
            }
        }
    }).fail(function(xhr) {
        console.error({
          msg: 'Auth to sever: ' + AUTH_SERVERS[serverId] + ' - fail',
          statusText: xhr.statusText,
          status: xhr.status
        });
        if(xhr.statusText != 'abort') {
            if (!navigator.onLine)
                authTimeoutLink = setTimeout(function () {
                    authToServer(items, serverId, isProxyOn);
                }, 5000);
            else if (serverId != 2)
                authToServer(items, serverId + 1, isProxyOn);
        } else {
            serverId = 2;
        }
    }).always(function() {
        if((serverResult && serverResult.result) || serverId == 2) {
            $('.loader img').hide();
            $('#btn-on-off').prop('disabled', false);
            authXHR = null;
        }
        if(!serverResult || (serverResult && !serverResult.result)) {
            $('#btn-on-off').next().removeClass('slider-green');
            authXHR = null;
        }
    });
}

function shuffleProxy() {
    $('#proxy-server option').shuffle();
}

// shuffle dom elements
$.fn.shuffle = function() {
    var allElems = this.get(),
        getRandom = function(max) {
            return Math.floor(Math.random() * max);
        },
        shuffled = $.map(allElems, function(){
            var random = getRandom(allElems.length),
                randEl = $(allElems[random]).clone(true)[0];
            allElems.splice(random, 1);
            return randEl;
        });

    this.each(function(i){
        $(this).replaceWith($(shuffled[i]));
    });

    return $(shuffled);
};

// валидация имени домена
function isValidDomain(v) {
    if (typeof v !== 'string') return false

    var parts = v.split('.')
    if (parts.length <= 1) return false

    var tld = parts.pop()
    var tldRegex = /^[a-zA-Z0-9]+$/gi

    if (!tldRegex.test(tld)) return false

    var isValid = parts.every(function(host) {
        var hostRegex = /^(?!:\/\/)([a-zA-Z0-9]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])$/gi;

        return hostRegex.test(host)
    })

    return isValid
}

// валидация url
function isValidURL(url) {
    var pattern = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return pattern.test(url);
}

function extractHostname(url) {
		var hostname;

		if (url.indexOf("//") > -1)
			hostname = url.split('/')[2];
		else
			hostname = url.split('/')[0];

		hostname = hostname.split(':')[0];
		hostname = hostname.split('?')[0];
		return hostname;
}

function extractRootDomain(url) {
	var domain = extractHostname(url),
		splitArr = domain.split('.'),
		arrLen = splitArr.length;

	if (arrLen > 2) {
		domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
		if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2)
			domain = splitArr[arrLen - 3] + '.' + domain;
	}
	return domain;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
