$(function() {

    // load Lang
    $('.btn-telegram').html(chrome.i18n.getMessage('btnTelegram'));

    // auth
    var ipData = $('#proxy-server').val().split(':');
    authToServer({ proxyServer: ipData[0], proxyPort: ipData[1] }, false, true);

    // change proxy server
    $('#proxy-server').change(function() {
        var ipData = $(this).val().split(':');

        // change href
        $('.btn-telegram').attr('href', 'tg://socks?server=' + ipData[0] + '&port=' + ipData[1] + '&user=&pass=');

        // change proxy server
        chrome.storage.local.set({ proxyServer: ipData[0], proxyPort: ipData[1] }, function() { });

        // auth
        authToServer({ proxyServer: ipData[0], proxyPort: ipData[1] }, false, true);
    });
});
