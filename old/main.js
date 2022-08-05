(function () {
    window.addEventListener('load', function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register("/apps/js/sw.js").then(function (registration) {
                console.log('Service Worker Registered,register script: serviceworker.js.');
                checkForPageUpdate(registration); // 检查新内容是否更新
            }).catch(function (error) {
                // registration failed
                console.log('Registration failed with ' + error);
            });
        }
    })

    // 服务工作人员状态更改的内容更新
    function checkForPageUpdate(registration) {
        // onupdatefound 将在首次安装和 serviceWorker.js 文件更改时触发
        registration.addEventListener("updatefound", function () {
            // 检查是否已安装 service worker 并控制页面
            if (navigator.serviceWorker.controller) {
                var installingSW = registration.installing;
                installingSW.onstatechange = function () {
                    console.info("Service Worker State :", installingSW.state);
                    switch (installingSW.state) {
                        case 'installed':
                            // 现在新内容将被添加到缓存中，旧内容将被删除，所以
                            // 这是向用户展示页面内容已更新的最佳时机。
                            toast('Site is updated. Refresh the page.', 5000);
                            break;
                        case 'redundant':
                            throw new Error('The installing service worker became redundant.');
                    }
                }
            }
        });
    }
})();