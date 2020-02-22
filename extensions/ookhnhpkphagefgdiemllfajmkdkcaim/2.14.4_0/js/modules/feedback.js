"use strict";

/* Version: 1.0.2 */

function Feedback() {

    this.init = function(props) {
        this.urlReview = 'https://chrome.google.com/webstore/detail/' + chrome.runtime.id + '/reviews';
        this.manifest = chrome.runtime.getManifest();

        this.delayTime = 86400000 * props.delayDays; // days
        this.delayTimeAfter = 60000 * props.delayMinutesAfter; // minutes

        this.feedbackAlarmHandler = props.feedbackAlarmHandler;

        chrome.storage.sync.get([ 'reviewLeft', 'reviewTime' ], this.checkReviewTime.bind(this));
    }

    this.checkReviewTime = function(items) {
        var dataNow = Date.now();
        if(items.reviewLeft === undefined) {
            var delayTime = dataNow + this.delayTime;
            chrome.storage.sync.set({ reviewTime: delayTime, reviewLeft: false });
            this.createAlarmFeedback(delayTime);
        } else if(items.reviewLeft === false && items.reviewTime !== 0) {
            var delayTime = dataNow > items.reviewTime ? dataNow + this.delayTimeAfter : items.reviewTime;
            this.createAlarmFeedback(delayTime);
        }
    }

    this.createAlarmFeedback = function(delayTime) {
        chrome.alarms.create('feedbackAlarm', { when: delayTime });
        chrome.alarms.onAlarm.addListener(this.onAlarmFeedback.bind(this));
    }

    this.onAlarmFeedback = function(alarm) {
        if(alarm.name == 'feedbackAlarm')
            this.createNotification();
    }

    this.createNotification = function() {
        chrome.notifications.create('feedbackNotific', {
            type: 'basic',
            iconUrl: this.manifest.icons['128'],
            title: this.manifest.name,
            message: chrome.i18n.getMessage('reviewMsg'),
            isClickable: true,
            requireInteraction: true
        }, this.notificationShownHandler.bind(this));

        chrome.notifications.onClicked.addListener(this.onClickedToFeedbackNotific.bind(this));
        chrome.notifications.onButtonClicked.addListener(this.onClickedToFeedbackNotific.bind(this));
    }

    this.notificationShownHandler = function() {
        if(!chrome.runtime.lastError) {
            if (this.feedbackAlarmHandler)
                this.feedbackAlarmHandler();
        }
    }

    this.onClickedToFeedbackNotific = function(notificationId, buttonIndex) {
        if(notificationId == 'feedbackNotific') {
            chrome.storage.sync.set({ reviewLeft: true, reviewTime: 0 });
            chrome.tabs.create({ url: this.urlReview });
            chrome.notifications.clear('feedbackNotific', function() { });
        }
    }

}
