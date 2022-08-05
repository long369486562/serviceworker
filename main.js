(function () {
    window.addEventListener('load', function () {
        importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.2.0/workbox-window.prod.mjs");
asdfasdfasdfasdf
        if ('serviceWorker' in navigator) {
            const wb = new Workbox('/apps/js/sw.js');
            wb.register();
        }
    })
})();
