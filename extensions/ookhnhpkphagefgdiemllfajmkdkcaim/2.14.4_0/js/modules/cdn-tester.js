(function() {
  const IS_DEV_MODE = true;
  const SERVER_API = 'cdn.extenbalanc.org';
  const FETCH_TIMEOUT = 60000;

  const FetchCustom = function(url, params) {
    var controller = new AbortController();
    params = params ? params : {};
    params.signal = controller.signal;

    var fetchPromise = fetch(url, params);

    if(params.timeout)
      setTimeout(controller.abort.bind(controller), params.timeout);

    return fetchPromise;
  };

  const WSClient = function() {
    const self = this;
    this.socket = null;

    this.init = function() {
      this.socket = new WebSocket('ws://' + SERVER_API + ':34821/cdn');

      this.socket.onopen = this.onOpenHandler.bind(this);
      this.socket.onclose = this.onCloseHandler.bind(this);
      this.socket.onmessage = this.onMessageHandler.bind(this);
      this.socket.onerror = this.onErrorHandler.bind(this);

      this.socket.emit = this.emitBehavior;
      this.socket.on = this.onBehavior;
    };

    // base handlers

    this.onOpenHandler = function() {
      if(IS_DEV_MODE)
        console.log("Connection established");
     if(this.socket && this.socket['open-connection'])
		   this.socket['open-connection']();
    };

    this.onMessageHandler = function(event) {
      if(IS_DEV_MODE)
        console.log("Received data " + event.data);

      try {
        let data = JSON.parse(event.data);

        if(typeof data !== 'object' || typeof data[0] !== 'string' || typeof data[1] !== 'object')
          return;

        let action = data[0];
        this.socket[action](data[1]);

      } catch(ex) {
        if(IS_DEV_MODE)
          console.log(ex);
      }
    };

    this.onCloseHandler = function(event) {
      if(IS_DEV_MODE) {
        if (event.wasClean)
          console.log('Connection closed clean');
        else
          console.log('Disconnection');
        console.log('Code: ' + event.code + ' cause: ' + event.reason);
      }

      setTimeout(this.init.bind(this), 15000);
    };

    this.onErrorHandler = function(error) {

    };

    // behaviors

    this.emitBehavior = function(action, message) {
      try {
        let payload = JSON.stringify([action, message]);
        this.send(payload);
      } catch(ex) {
        if(IS_DEV_MODE)
          console.log(ex);
      }
    };

    this.onBehavior = function(action, callback) {
      this[action] = callback;
    };

    this.init();
  };

  const TimeMeasurerRequest = function() {
    const self = this;
    const extensionId = chrome.runtime.id;
    var mapRequests = {};
    this.requests = {};

    this.init = function() {
      chrome.webRequest.onSendHeaders.addListener(
          this.onSendHeadersHandler.bind(this),
          { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
          ['requestHeaders']
      );
      chrome.webRequest.onHeadersReceived.addListener(
          this.onHeadersReceivedHandler.bind(this),
          {urls: ['<all_urls>'], types: ['xmlhttprequest'] },
          ['responseHeaders']
      );
      chrome.webRequest.onCompleted.addListener(
          this.onCompletedHandler.bind(this),
          { urls: ['<all_urls>'], types: ['xmlhttprequest'] },
          []
      );
    };

    this.onSendHeadersHandler = function(details) {
      if(!self.filtrationByParams(details))
        return;

      var token = null;

      for (var i = 0; i < details.requestHeaders.length; i++)
        if (details.requestHeaders[i].name == 'x-cdn-token') {
          token = details.requestHeaders[i].value;
          details.requestHeaders.splice(i, 1);
          break;
        }

      if(!token)
        return;

      mapRequests[details.requestId] = token;
      self.requests[token].url = details.url;
      self.requests[token].times = [details.timeStamp];

      if(IS_DEV_MODE)
        console.log('onSendHeaders', details);

      return { requestHeaders: details.requestHeaders };
    };

    this.onHeadersReceivedHandler = function(details) {
      let token = mapRequests[details.requestId];
      if(!self.filtrationByParams(details) || !token || !self.requests[token])
        return;

      self.requests[token].times.push(details.timeStamp);

      if(IS_DEV_MODE)
        console.log('onHeadersReceived', details);
    };

    this.onCompletedHandler = function(details) {
      let token = mapRequests[details.requestId];
      if(!self.filtrationByParams(details) || !token || !self.requests[token])
        return;

      let requestData = self.requests[token];
      requestData.times.push(details.timeStamp);
      requestData.times = self.countTimeSpan(requestData.times);

      delete mapRequests[token];

      if(IS_DEV_MODE)
        console.log('onCompleted', details);
    };

    this.countTimeSpan = function (times) {
      times[0] = Math.round(times[1] - times[0]);
      times[1] = Math.round(times[2] - times[1]);
      times[2] = Math.round(times[0] + times[1]);
      return times;
    };

    this.filtrationByParams = function (details) {
      if(details.tabId != -1 || details.initiator.indexOf(extensionId) == -1)
        return false;
      return true;
    }

    this.init();
  };

  const CDNChecker = function() {
    const self = this;
    var linkTimeWait = null;
    const wsClient = new WSClient();
    const timeMeasurer = new TimeMeasurerRequest();

    this.init = function() {
      wsClient.socket.on('request-measure-time', this.measureTimeHandler.bind(this));
      wsClient.socket.on('request-stop-last-test', this.stopLastTestHandler.bind(this));

      wsClient.socket.on('open-connection', function() {
        self.getUserLocation()
          .then(function(location) {
            wsClient.socket.emit('response-location', location);
          });
      });
    };

    // handlers

    this.measureTimeHandler = function(msg) {
      this.stopLastTestHandler();
      linkTimeWait = setTimeout(this.measureTimeSpan.bind(this, msg), msg.timeWait);
    };

    this.stopLastTestHandler = function() {
      if(linkTimeWait)
        clearTimeout(linkTimeWait);
    };

    // senders

    this.sendMeasureTimeResponse = function(details) {
      wsClient.socket.emit('response-measure-time', details);
    };

    // other

    this.sendGetRequest = function(url) {
      return fetch(url).then(function(response) {
        if (response.status != 200)
          throw new Error(THROW_RESPONSE_BAD);
        return response;
      }).catch(function(ex) {
        return ex;
      });
    };

    this.getUserLocation = function() {
      return this.sendGetRequest('http://ip-api.com/json/?fields=country,city,regionName,query')
        .then(function(response) {
          return response.json();
        });
    };

    this.measureTimeSpan = function(details) {
      let headers = new Headers();
      headers.append('pragma', 'no-cache');
      headers.append('cache-control', 'no-cache');
      headers.append('x-cdn-token', details.token);
      timeMeasurer.requests[details.token] = {
        token: details.token
      };

      return FetchCustom(details.url, {
        method: 'GET',
        headers: headers,
        timeout: FETCH_TIMEOUT
      }).then(function(response) {
        if (response.status != 200)
          throw new Error(THROW_BAD_RESPONSE);
        return response.blob();
      }).then(function(response) {
        let requestData = timeMeasurer.requests[details.token];
        requestData.size = response.size;
        requestData.speed = Math.round(response.size / requestData.times[2]);
        self.sendMeasureTimeResponse(requestData);
      }).catch(function(ex) {
        if(IS_DEV_MODE)
          console.log(ex);
      }).finally(function() {
        delete timeMeasurer.requests[details.token];
      });
    };

    this.init();
  };

  const cdnChecker = new CDNChecker();

})();
