'use strict';
//缓存版本号，随着页面的更改，如果要更新缓存，请修改这里的版本号
const version = 'v20190212';
const __DEVELOPMENT__ = false;
const __DEBUG__ = false;
//配置两个离线用资源--不可以有404资源
const offlineResources = ['/'];
//用于资源更新？
const ignoreFetch = [
  //忽略抓取的URL或目录，请酌情修改
  /https?:\/\/xiongzhang.baidu.com\//,
  /https?:\/\/ae.bdstatic.com\//,
  /https?:\/\/msite.baidu.com\//,
  /https?:\/\/s.bdstatic.com\//,
  /https?:\/\/timg01.bdimg.com\//,
  /https?:\/\/zz.bdstatic.com\//,
  /https?:\/\/hm.baidu.com\//,
  /https?:\/\/jspassport.ssl.qhimg.com\//,
  /https?:\/\/s.ssl.qhres.com\//,
  /https?:\/\/changyan.itc.cn\//,
  /https?:\/\/changyan.sohu.com\//,
  /.php$/,
  /more/,
];
//添加 `install` 事件监听器
self.addEventListener('install', (event) => {
  console.info('Event: Install');

  event.waitUntil(
    caches.open(cacheName)
    .then((cache) => {
      //[] 要缓存的文件 & 如果任何文件不存在 `addAll` 将失败
      return cache.addAll(files)
      .then(() => {
        console.info('All files are cached');
        return self.skipWaiting(); //强制等待的服务工作者成为活跃的服务工作者
      })
      .catch((error) =>  {
        console.error('Failed to cache', error);
      })
    })
  );
});

/*
  FETCH EVENT：在安装后由索引页面发出的每个请求触发。
*/
self.addEventListener('click', (event) => {
  console.info('Event: Install');

  Notification.requestPermission().then(function(result) {
    // result可能是是granted, denied, 或default.
  });
});

//添加 `fetch` 事件监听器
self.addEventListener('fetch', (event) => {
  console.info('Event: Fetch');

  var request = event.request;
  var url = new URL(request.url);
  if (url.origin === location.origin) {
    // 静态文件缓存
    event.respondWith(cacheFirst(request));
  } else {
    // 动态 API 缓存
    event.respondWith(networkFirst(request));
  }

  // //检查导航预加载响应
  // if (event.preloadResponse) {
  //   console.info('使用导航预加载');
  //   return response;
  // }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function networkFirst(request) {
  const dynamicCache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    // Cache the dynamic API response
    dynamicCache.put(request, networkResponse.clone()).catch((err) => {
      console.warn(request.url + ': ' + err.message);
    });
    return networkResponse;
  } catch (err) {
    const cachedResponse = await dynamicCache.match(request);
    return cachedResponse;
  }
}

/*
  ACTIVATE EVENT：注册后触发一次，也用于清理缓存。
*/
//添加 `activate` 事件监听器
self.addEventListener('activate', (event) => {
  console.info('Event: Activate');

  //导航预加载帮助我们在服务工作者启动时发出并行请求。
//启用 -chrome://flags/#enable-service-worker-navigation-preload
//支持 -Chrome 57 beta（作为旗帜）
//更多信息 -https://developers.google.com/web/updates/2017/02/navigation-preload#the-problem

  // 检查是否支持 navigationPreload
  // if (self.registration.navigationPreload) { 
  //   self.registration.navigationPreload.enable();
  // }
  // else if (!self.registration.navigationPreload) { 
  //   console.info('您的浏览器不支持导航预加载。');
  // }

  //删除旧的和不需要的缓存
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== cacheName) {
            return caches.delete(cache); //删除旧缓存（缓存 v1）
          }
        })
      );
    })
    .then(function () {
      console.info("Old caches are cleared!");
      // 告诉服务人员激活当前的
// 而不是等待旧的完成。
      return self.clients.claim(); 
    }) 
  );
});

/*
  PUSH EVENT：每次收到推送通知时触发。
*/
//添加 `push` 事件监听器
self.addEventListener('push', (event) => {
  console.info('Event: Push');

  var title = 'Push notification demo';
  var body = {
    'body': 'click to return to application',
    'tag': 'demo',
    'icon': './images/icons/apple-touch-icon.png',
    'badge': './images/icons/apple-touch-icon.png',
    //自定义操作按钮
    'actions': [
      { 'action': 'yes', 'title': 'I ♥ this app!'},
      { 'action': 'no', 'title': 'I don\'t like this app'}
    ]
  };

  event.waitUntil(self.registration.showNotification(title, body));
});

/*
  背景同步事件：在 `bg sync` 注册并且页面有网络连接后触发。
  它将尝试获取 github 用户名，如果满足则同步完成。如果失败了，
  另一个同步计划重试（也将等待网络连接）
*/

self.addEventListener('sync', (event) => {
  console.info('Event: Sync');

  //从 devTools 检查注册的同步名称或模拟同步
  if (event.tag === 'github' || event.tag === 'test-tag-from-devtools') {
    event.waitUntil(
      //检查所有打开的选项卡并将 postMessage 发送到这些选项卡
      self.clients.matchAll().then((all) => {
        return all.map((client) => {
          return client.postMessage('online'); //要发出获取请求，请检查 app.js -行号：122
        })
      })
      .catch((error) => {
        console.error(error);
      })
    );
  }
});

/*
  通知事件：当用户点击通知时触发。
*/
//添加“通知”点击事件监听器
self.addEventListener('notificationclick', (event) => {
  var url = 'https://demopwa.in/';

  //在推送通知中收听自定义操作按钮
  if (event.action === 'yes') {
    console.log('I ♥ this app!');
  }
  else if (event.action === 'no') {
    console.warn('I don\'t like this app');
  }

  event.notification.close(); //关闭通知

  //点击通知后打开应用
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clients) => {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        //如果站点已打开，请关注站点
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      //如果网站无法打开，请在新窗口中打开
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
    .catch((error) => {
      console.error(error);
    })
  );
});
//手动唤醒浏览器询问用户是否安装到桌面
self.addEventListener('beforeinstallprompt', function(event) { // 监听到可安装事件，进行触发提醒用户
  setTimeout(function() {
      event.prompt()
      event.userChoice //判断用户是否安装
          .then(function(e) {
              install = true
          })    
  }, 2000)
}, { once: true })
//通知提醒
// self.addEventListener('click', function() {
//   if (appPromptEvent !== null) {
//       appPromptEvent.prompt();
//       appPromptEvent.userChoice.then(function(result) {
//           if (result.outcome == 'accepted') {
//               console.log('同意安装应用');
//               // 记录安装次数
//               // 请求数据埋点接口，记录安装数量
//           } else {
//               console.log('不同意安装应用');
//           }
//           appPromptEvent = null;
//       });
//   }
// });
