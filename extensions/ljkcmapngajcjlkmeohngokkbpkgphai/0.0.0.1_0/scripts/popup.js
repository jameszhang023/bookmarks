function select_country_animation() {
    $("#main").hide().attr("class", "app"), $("#select_country").show().attr("class", "app animated fadeInRight")
}

function select_country_back_animation() {
    $("#select_country").hide().attr("class", "app"), $("#main").show().attr("class", "app animated fadeInLeft")
}

function settings_animation() {
    $("#main").hide().attr("class", "app"), $("#settings").show().attr("class", "app animated fadeInRight")
}

function settings_back_animation() {
    $("#settings").hide().attr("class", "app"), $("#main").show().attr("class", "app animated fadeInLeft")
}

function last_connected_servers_animation() {
    $("#main").hide().attr("class", "app"), $("#last_connected_servers").show().attr("class", "app animated fadeInRight")
}

function last_connected_servers_back_animation() {
    $("#last_connected_servers").hide().attr("class", "app"), $("#main").show().attr("class", "app animated fadeInLeft")
}
$("#main").show(), $("#settings").hide(), $("#select_country").hide(), $("#last_connected_servers").hide(), $("#remaing_time").hide(), $("#country_select_page_button").html(chrome.i18n.getMessage("country_select_page_button")), $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + chrome.i18n.getMessage("please_wait_text")), $("#ping").html("Ping : 0ms"), $("#action_button").html(chrome.i18n.getMessage("connect_button_text")), $("#select_country_title").html(chrome.i18n.getMessage("country_select_page_button")), $("#option_title").html(chrome.i18n.getMessage("settings_title")), $("#option_autoconnect_title").html("Autoconnect<span>Connecting to VPN with run application</span>"), $("#last_connected_servers_title").html(chrome.i18n.getMessage("last_connected_servers_title")), chrome.runtime.sendMessage({
    query: "userdata"
}), chrome.runtime.onMessage.addListener(function(t, e, s) {
    "countrylist_saved" == t.query && ($("#country_list").html(""), chrome.storage.local.get(["countrylist", "selected_country_code", "type", "expire_time", "key"], function(t) {
        if (t.countrylist) {
            for (key in t.countrylist) t.countrylist[key].country_code == t.selected_country_code && $("#country_list").append('\t\t\t\t\t<div class="countries-item countries-item_selected">                                        <div class="countries-item__country">                                            <div class="countries-item__flag">\t\t\t\t\t\t\t\t\t\t\t<img src="../images/flags/' + t.countrylist[key].country_name.toLowerCase().split(" ").join("-") + '.svg" id="selected_country_flag"></div>                                             <div class="countries-item__title" id="selected_country_name">' + t.countrylist[key].country_name + '</div>                                        </div>                                        <div class="countries-item__selected">                                             ' + chrome.i18n.getMessage("selected") + "                                          </div>                                     </div>");
            for (key in t.countrylist) "free" == t.type && (t.countrylist[key].country_code != t.selected_country_code && t.countrylist[key].type == t.type ? $("#country_list").append('\t\t\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.countrylist[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.countrylist[key].country_name + '<br><div style="padding: 2px 0;color: #9d9d9d;">● ' + t.countrylist[key].servers + ' Servers</div>\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t<div class="countries-item__select" name="country_select" country-type="' + t.countrylist[key].type + '" country-code="' + t.countrylist[key].country_code + '" country-name="' + t.countrylist[key].country_name + '">\t\t\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("select") + "\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t</div>") : t.countrylist[key].country_code != t.selected_country_code && t.countrylist[key].type != t.type && $("#country_list").append('\t\t\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.countrylist[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.countrylist[key].country_name + '<br><div style="padding: 2px 0;color: #9d9d9d;">● ' + t.countrylist[key].servers + ' Servers</div>\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t<div class="countries-item__buy" name="vpn_service_buy" country-type="' + t.countrylist[key].type + '" country-code="' + t.countrylist[key].country_code + '" country-name="' + t.countrylist[key].country_name + '">\t\t\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("buy") + "\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t</div>")), "premium" == t.type && t.countrylist[key].country_code != t.selected_country_code && $("#country_list").append('\t\t\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.countrylist[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.countrylist[key].country_name + '<br><div style="padding: 2px 0;color: #9d9d9d;">● ' + t.countrylist[key].servers + ' Servers</div>\t\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t<div class="countries-item__select" name="country_select" country-type="' + t.countrylist[key].type + '" country-code="' + t.countrylist[key].country_code + '" country-name="' + t.countrylist[key].country_name + '">\t\t\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("select") + "\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t</div>")
        }
        $('div[name="vpn_service_buy"]').on("click", function(e) {
            var s = "https://ozmovpn.com/premium/" + t.key;
            chrome.tabs.create({
                url: s
            })
        }), $('div[name="country_select"]').on("click", function(t) {
            chrome.storage.local.set({
                selected_country_type: t.currentTarget.attributes["country-type"].nodeValue
            }, function() {}), chrome.storage.local.set({
                selected_country_code: t.currentTarget.attributes["country-code"].nodeValue
            }, function() {}), chrome.storage.local.set({
                selected_country_name: t.currentTarget.attributes["country-name"].nodeValue
            }, function() {}), select_country_back_animation()
        })
    })), "connected" == t.query && ($("#status_bar").attr("class", "spinner2"), $("#vpn_status").attr("style", "color:#4CAF50;"), $("#status_text").html(chrome.i18n.getMessage("status_connected_text")), $("#status_text_description").html(chrome.i18n.getMessage("status_connected_description_text")), $("#action_button").attr("class", "actions__button actions__button_disconnect"), $("#action_button").html(chrome.i18n.getMessage("disconnect_button_text")), $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + t.ip), $("#ping").html("Ping : " + t.ping + "ms"), $("#action_button").show().attr("disabled", !1), $("#ipaddress").show(), $("#ping").show()), "connection_error" == t.query && ($("#status_bar").attr("class", "spinner3"), $("#status_text").html(chrome.i18n.getMessage("status_disconnected_text")), $("#vpn_status").attr("style", ""), $("#status_text_description").html(chrome.i18n.getMessage("connection_error")), $("#action_button").attr("class", "actions__button actions__button_connect"), $("#action_button").html(chrome.i18n.getMessage("connect_button_text")), $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + t.ip), $("#ping").html("Ping : " + t.ping + "ms"), $("#action_button").show().attr("disabled", !1), $("#ipaddress").show(), $("#ping").show()), "try_again_another_location" == t.query && ($("#status_bar").attr("class", "spinner3"), $("#status_text").html(chrome.i18n.getMessage("status_disconnected_text")), $("#vpn_status").attr("style", ""), $("#status_text_description").html(chrome.i18n.getMessage("location_error")), $("#action_button").attr("class", "actions__button actions__button_connect"), $("#action_button").html(chrome.i18n.getMessage("connect_button_text")), $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + t.ip), $("#ping").html("Ping : " + t.ping + "ms"), $("#action_button").show().attr("disabled", !1), $("#ipaddress").show(), $("#ping").show()), "userdata_saved" == t.query && ($("#premium_key").attr("class", ""), chrome.storage.local.get(["type", "expire_time"], function(t) {
        if ("premium" == t.type) {
            var e = new Date / 1e3,
                s = t.expire_time - e,
                n = Math.floor(s / 86400);
            $("#remaing_time").show().html(chrome.i18n.getMessage("remaing_time") + " : " + n + " " + chrome.i18n.getMessage("day"))
        } else $("#save_key").show(), $("#premium_key").attr("style", "position: absolute;border-radius: 15px;border: 3px solid #e50914 !important;left: 55px;height: 30px;")
    })), "key_success" == t.query && ($("#save_key").hide(), $("#premium_key").attr("style", "position: absolute;border-radius: 15px;border: 3px solid #8BC34A !important;left: 55px;height: 30px;")), "key_failed" == t.query && ($("#premium_key").attr("class", "animated shake"), setTimeout(function() {
        $("#premium_key").attr("class", "")
    }, 500))
}), chrome.storage.local.get(["connection_time"], function(t) {
    var e = 0;
    t.connection_time && ((new Date).getTime() < t.connection_time && (e = 1));
    if (1 == navigator.onLine)
        if (0 == e) {
            chrome.proxy.settings.get({}, function(t) {
                "system" == t.value.mode || "direct" == t.value.mode ? ($("#status_bar").attr("class", "spinner3"), $("#status_text").html(chrome.i18n.getMessage("status_disconnected_text")), $("#status_text_description").html(chrome.i18n.getMessage("status_disconnected_description_text")), $("#action_button").attr("class", "actions__button actions__button_connect"), $("#action_button").html(chrome.i18n.getMessage("connect_button_text"))) : ($("#status_bar").attr("class", "spinner2"), $("#vpn_status").attr("style", "color:#4CAF50;"), $("#status_text").html(chrome.i18n.getMessage("status_connected_text")), $("#status_text_description").html(chrome.i18n.getMessage("status_connected_description_text")), $("#action_button").attr("class", "actions__button actions__button_disconnect"), $("#action_button").html(chrome.i18n.getMessage("disconnect_button_text")))
            });
            var s = (new Date).getTime();
            fetch("https://ip.ozmovpn.com/?rand=" + Math.random()).then(function(t) {
                $("#action_button").show(), $("#ipaddress").show(), $("#ping").show(), $("#pc_status").attr("style", "color:#4CAF50;");
                var e = (new Date).getTime();
                t.json().then(function(t) {
                    $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + t.ip), $("#ping").html("Ping : " + Math.floor((e - s) / 8) + "ms")
                })
            }).catch(function(t) {
                "system" != data.value.mode && "direct" != data.value.mode && ($("#pc_status").attr("style", "color:#ff2818;"), $("#status_text").html(chrome.i18n.getMessage("network_problem_title")), $("#status_text_description").html(chrome.i18n.getMessage("network_problem_decription")), $("#action_button").hide(), $("#ipaddress").hide(), $("#ping").hide())
            })
        } else $("#status_bar").attr("class", "spinner"), $("#status_text").html(chrome.i18n.getMessage("connecting_title")), $("#status_text_description").html(chrome.i18n.getMessage("please_wait_text")), $("#ipaddress").hide(), $("#ping").hide(), $("#action_button").attr("class", "actions__button actions__button_wait").attr("disabled", "disabled").html(chrome.i18n.getMessage("please_wait_text"));
    else $("#status_bar").attr("class", "spinner3"), $("#pc_status").attr("style", "color:#ff2818;"), $("#status_text").html(chrome.i18n.getMessage("network_problem_title")), $("#status_text_description").html(chrome.i18n.getMessage("network_problem_decription")), $("#action_button").hide(), $("#ipaddress").hide(), $("#ping").hide()
}), chrome.storage.local.get(["selected_country_name"], function(t) {
    t.selected_country_name && ($("#country_title").html(t.selected_country_name), $("#country_flag_image").attr("src", "../images/flags/" + t.selected_country_name.toLowerCase().split(" ").join("-") + ".svg"), $("#selected_country_name").html(t.selected_country_name), $("#selected_country_flag").attr("src", "../images/flags/" + t.selected_country_name.toLowerCase().split(" ").join("-") + ".svg"))
}), $("#netflix").change(function() {
    this.checked ? chrome.storage.local.set({
        netflix_option: "yes"
    }, function() {}) : chrome.storage.local.set({
        netflix_option: "no"
    }, function() {})
}), $("#autoconnect").change(function() {
    this.checked ? chrome.storage.local.set({
        autoconnect_option: "yes"
    }, function() {}) : chrome.storage.local.set({
        autoconnect_option: "no"
    }, function() {})
}), $("#country_select_page_button").on("click", function() {
    chrome.runtime.sendMessage({
        query: "countrylist"
    }), select_country_animation()
}), $("#settings_page_button").on("click", function() {
    settings_animation()
}), $("#last_connected_servers_page_button").on("click", function() {
    chrome.storage.local.get(["last_connected_servers", "type"], function(t) {
        if ($("#last_connected_country_list").html(""), t.last_connected_servers)
            for (key in t.last_connected_servers) "free" == t.type && (t.last_connected_servers[key].type == t.type ? $("#last_connected_country_list").append('\t\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.last_connected_servers[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.last_connected_servers[key].country_name + '</div>\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t<div class="countries-item__select" name="last_connected_country_select" country-type="' + t.last_connected_servers[key].type + '" country-code="' + t.last_connected_servers[key].country_code + '" country-name="' + t.last_connected_servers[key].country_name + '">\t\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("select") + "\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t</div>") : t.last_connected_servers[key].type != t.type && $("#last_connected_country_list").append('\t\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.last_connected_servers[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.last_connected_servers[key].country_name + '</div>\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t<div class="countries-item__buy" name="vpn_service_buy" country-type="' + t.last_connected_servers[key].type + '" country-code="' + t.last_connected_servers[key].country_code + '" country-name="' + t.last_connected_servers[key].country_name + '">\t\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("buy") + "\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t</div>")), "premium" == t.type && $("#last_connected_country_list").append('\t\t\t\t\t\t<div class="countries-item countries-item">\t\t\t\t\t\t\t<div class="countries-item__country">\t\t\t\t\t\t\t\t<div class="countries-item__flag"><img src="../images/flags/' + t.last_connected_servers[key].country_name.toLowerCase().split(" ").join("-") + '.svg">\t\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t\t<div class="countries-item__title">' + t.last_connected_servers[key].country_name + '</div>\t\t\t\t\t\t\t</div>\t\t\t\t\t\t\t<div class="countries-item__select" name="last_connected_country_select" country-type="' + t.last_connected_servers[key].type + '" country-code="' + t.last_connected_servers[key].country_code + '" country-name="' + t.last_connected_servers[key].country_name + '">\t\t\t\t\t\t\t\t' + chrome.i18n.getMessage("select") + "\t\t\t\t\t\t\t</div>\t\t\t\t\t\t</div>");
        $('div[name="vpn_service_buy"]').on("click", function(e) {
            var s = "https://ozmovpn.com/premium/" + t.key;
            chrome.tabs.create({
                url: s
            })
        }), $('div[name="last_connected_country_select"]').on("click", function(t) {
            chrome.storage.local.set({
                selected_country_type: t.currentTarget.attributes["country-type"].nodeValue
            }, function() {}), chrome.storage.local.set({
                selected_country_code: t.currentTarget.attributes["country-code"].nodeValue
            }, function() {}), chrome.storage.local.set({
                selected_country_name: t.currentTarget.attributes["country-name"].nodeValue
            }, function() {}), last_connected_servers_back_animation()
        })
    }), last_connected_servers_animation()
}), $("#save_key").on("click", function() {
    chrome.storage.local.set({
        key2: $("#premium_key").val()
    }, function() {}), chrome.runtime.sendMessage({
        query: "new_key_control"
    })
}), $("#back_button_select_coutry_page").on("click", function() {
    select_country_back_animation()
}), $("#back_button_last_connected_servers").on("click", function() {
    last_connected_servers_back_animation()
}), $("#back_button_settings_page").on("click", function() {
    settings_back_animation()
}), $("#action_button").on("click", function() {
    chrome.proxy.settings.get({}, function(t) {
        if ("system" == t.value.mode || "direct" == t.value.mode) {
            $("#status_bar").attr("class", "spinner"), $("#status_text").html(chrome.i18n.getMessage("connecting_title")), $("#status_text_description").html(chrome.i18n.getMessage("please_wait_text")), $("#ipaddress").hide(), $("#ping").hide(), $("#action_button").attr("class", "actions__button actions__button_wait").attr("disabled", "disabled").html(chrome.i18n.getMessage("please_wait_text")), chrome.runtime.sendMessage({
                query: "pacdata"
            });
            var e = (new Date).getTime() + 7e3;
            chrome.storage.local.set({
                connection_time: e
            }, function() {})
        } else chrome.proxy.settings.clear({}), chrome.proxy.settings.get({}, function(t) {
            "system" == t.value.mode || "direct" == t.value.mode ? chrome.browserAction.setIcon({
                path: {
                    128: "/images/disconnected-128.png"
                }
            }) : chrome.browserAction.setIcon({
                path: {
                    128: "/images/connected-128.png"
                }
            })
        }), $("#action_button").attr("class", "actions__button actions__button_wait").attr("disabled", "disabled").html(chrome.i18n.getMessage("please_wait_text")), setTimeout(function() {
            $("#status_bar").attr("class", "spinner3"), $("#vpn_status").attr("style", ""), $("#status_text").html(chrome.i18n.getMessage("status_disconnected_text")), $("#status_text_description").html(chrome.i18n.getMessage("status_disconnected_description_text")), $("#action_button").attr("class", "actions__button actions__button_connect").attr("disabled", !1), $("#action_button").html(chrome.i18n.getMessage("connect_button_text"));
            var t = (new Date).getTime();
            fetch("https://ip.ozmovpn.com/?rand=" + Math.random()).then(function(e) {
                $("#action_button").show(), $("#ipaddress").show(), $("#ping").show(), $("#pc_status").attr("style", "color:#4CAF50;");
                var s = (new Date).getTime();
                e.json().then(function(e) {
                    $("#ipaddress").html(chrome.i18n.getMessage("ip_address_text") + " : " + e.ip), $("#ping").html("Ping : " + Math.floor((s - t) / 8) + "ms")
                })
            }).catch(function(t) {
                $("#pc_status").attr("style", "color:#ff2818;"), $("#status_text").html(chrome.i18n.getMessage("network_problem_title")), $("#status_text_description").html(chrome.i18n.getMessage("network_problem_decription")), $("#action_button").hide(), $("#ipaddress").hide(), $("#ping").hide()
            })
        }, 1e3)
    })
}), chrome.storage.onChanged.addListener(function(t) {
    t.selected_country_name && ($("#country_title").html(t.selected_country_name.newValue), $("#country_flag_image").attr("src", "../images/flags/" + t.selected_country_name.newValue.toLowerCase().split(" ").join("-") + ".svg"), $("#selected_country_name").html(t.selected_country_name.newValue), $("#selected_country_flag").attr("src", "../images/flags/" + t.selected_country_name.newValue.toLowerCase().split(" ").join("-") + ".svg"))
}), chrome.storage.local.get(["netflix_option", "autoconnect_option", "key", "type"], function(t) {
    t.netflix_option && "yes" == t.netflix_option ? $("#netflix").attr("checked", !0) : $("#netflix").attr("checked", !1), t.autoconnect_option && "yes" == t.autoconnect_option ? (chrome.proxy.settings.get({}, function(t) {
        "system" != t.value.mode && "direct" != t.value.mode || ($("#status_bar").attr("class", "spinner"), $("#status_text").html(chrome.i18n.getMessage("connecting_title")), $("#status_text_description").html(chrome.i18n.getMessage("please_wait_text")), $("#ipaddress").hide(), $("#ping").hide(), $("#action_button").attr("class", "actions__button actions__button_wait").attr("disabled", "disabled").html(chrome.i18n.getMessage("please_wait_text")), chrome.runtime.sendMessage({
            query: "pacdata"
        }))
    }), $("#autoconnect").attr("checked", !0)) : $("#autoconnect").attr("checked", !1), t.key && ($("#premium_key").val(t.key), "premium" == t.type && ($("#save_key").hide(), $("#premium_key").attr("style", "position: absolute;border-radius: 15px;border: 3px solid #8BC34A !important;left: 55px;height: 30px;")))
});