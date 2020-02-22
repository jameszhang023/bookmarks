(function() {
  const IS_VISIBLE_LOGS = true;
  const SCRIPT_RUN_IN = (location.pathname.indexOf('popup') != -1) ? 'popup' : 'background';
  var userLocation;
  var listLogs = [];

  const onerrorOrign = window.onerror;
  window.onerror = function(msg, path, line) {
    console.error({
      msg: msg,
      path: path,
      line: line
    }, 'onerror');
    if(onerrorOrign)
      onerrorOrign();
    return true;
  }

  const fetchOrign = window.fetch;
  window.fetch = function(url, options) {
    return fetchOrign(url, options)
      .then(function(response) {
        if(response.status !== 200) {
          var payload = {
            url: url,
            response: response.statusText + ' - ' + response.status
          };
          console.error(payload, 'fetch');
        }
        return response;
      }).catch(function(err) {
        console.error(err, 'fetch');
        throw err;
      });
  };

  const consoleErrorOrign = window.console.error;
  window.console.error = function(error, typeError) {
    if(IS_VISIBLE_LOGS)
      console.log(error);

    if(isObjectEmpty(error))
      return;

    var payload = JSON.stringify({
      typeError: typeError ? typeError : 'console',
      extensionId: chrome.runtime.id,
      userLocation: userLocation,
      error: error,
      script: SCRIPT_RUN_IN
    });
    var logHash = getHashCode(payload);

    if(listLogs.indexOf(logHash) != -1)
      return;

    listLogs.push(logHash);
    if(userLocation)
      return sendToServerLogs({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });
    getUserLocation().then(window.console.error.bind(null, error, typeError));
  };

  function sendToServerLogs(options) {
    fetchOrign(LOG_SERVER_ADDR + '/logs', options)
      .then(function() { })
      .catch(function() { });
  }

  function isObjectEmpty() {
    for(var key in this)
      if(this.hasOwnProperty(key))
        return false;
    return true;
  };

  function getHashCode(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
      while (i < l)
        h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
  }

  function getUserLocation() {
    return fetchOrign('http://ip-api.com/json/?fields=status,countryCode,country,regionName,query')
      .then(function(response) {
        if(response.status == 200)
          return response.json();
        throw new Error(response.statusText);
      })
      .then(function(response) {
        if(response.status != 'success')
          throw new Error(response.status);
        userLocation = response;
        return response;
      })
      .catch(setTimeout.bind(null, getUserLocation, 30000));
  }

})();
