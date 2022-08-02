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
//自定义打印方法
function log() {
  // if (developmentMode()) {
  console.log("SW:", ...arguments);
  // }
}
//开始安装
function onInstall(event) {
  log('install event in progress.');
  event.waitUntil(updateStaticCache());
}
//处理cache字段
function cacheKey() { return [version, ...arguments].join(':'); }
//更新静态缓存
function updateStaticCache() {
  return caches.open(cacheKey('offline'))
    .then((Cache) => {
      console.log(Cache);
      //接受一个 URL 数组，检索它们，并将生成的 response 对象添加到给定的缓存中
      return Cache.addAll(offlineResources);
    })
    .then(() => {
      log('installation complete!');
    });
}
//更新动态缓存--指各种资源
function onFetch(event) {
  //返回各种资源加载的request对象
  const request = event.request;
  //根据 当前环境，请求方法，url判断是否更新缓存
  if (shouldAlwaysFetch(request)) {
    event.respondWith(networkedOrOffline(request));
    return;
  }
   //根据 请求头  header 接受的返回类型  判断是否更新缓存
  if (shouldFetchAndCache(request)) {
    event.respondWith(networkedOrCached(request));
    return;
  }
  //其他未指定的缓存
  event.respondWith(cachedOrNetworked(request));
}
//判断是否有页面缓存
function networkedOrCached(request) {
  return networkedAndCache(request)
    .catch(() => {
      return cachedOrOffline(request)
    });
}
//处理未指定的缓存
function networkedAndCache(request) {
  return fetch(request).then((response) => {
    var copy = response.clone();
    caches.open(cacheKey('resources')).then((cache) => { cache.put(request, copy); });
    log("(network: cache write)", request.method, request.url); return response;
  });
}
//判断未指定的资源是否有缓存
function cachedOrNetworked(request) {
  return caches.match(request)
    .then((response) => {
      log(response ? '(cached)' : '(network: cache miss)', request.method, request.url);
      //如果没有缓存开始创建缓存并返回
      return response || networkedAndCache(request).catch(() => {
          return offlineResponse(request)
        });
    });
}
//判断资源是否已经缓存，如果已经缓存，直接从缓存中返回资源，否则重新请求--资源
function networkedOrOffline(request) {
  return fetch(request)
    .then((response) => {
      log('(network)', request.method, request.url);
      return response;
    })
    .catch(() => {
      return offlineResponse(request);
    });
}
//判断资源是否已经缓存，如果已经缓存，直接从缓存中返回资源，否则重新请求--页面
function cachedOrOffline(request) {
  return caches.match(request)
    .then((response) => {
      return response || offlineResponse(request);
    });
}
//从缓存中取出已经缓存的静态资源，直接返回给请求--公共
function offlineResponse(request) {
  log('(offline)', request.method, request.url);
  if (request.url.match(/\.(jpg|png|gif|svg|jpeg)(\?.*)?$/)) {
    return caches.match('/offline.svg');
  } else {
    return caches.match('/offline.html');
  }
}
function onActivate(event) {
  log('activate event in progress.');
  event.waitUntil(removeOldCache());
}
function removeOldCache() {
  return caches.keys()
    .then((keys) => {
      return Promise.all(keys.filter((key) => {
        return !key.startsWith(version);
      })
        .map((key) => {
          return caches.delete(key);
        }));
    })
    .then(() => {
      log('removeOldCache completed.');
    });
}
//判断是否忽略资源缓存
function shouldAlwaysFetch(request) {
  //ignoreFetch是一个忽略元素的regex正则列表
  return __DEVELOPMENT__ || request.method !== 'GET' || ignoreFetch.some(regex => request.url.match(regex));
}
//判断是否忽略资源缓存--接受类型
function shouldFetchAndCache(request) {
  return ~request.headers.get('Accept').indexOf('text/html');
}
function developmentMode() {
  return __DEVELOPMENT__ || __DEBUG__;
}
log("Hello from ServiceWorker land!", version);
//安装PWA缓存开始---------
//默认传递一个event事件对象
//创建安装
self.addEventListener('install', onInstall);
//进行资源缓存-和取出缓存
self.addEventListener('fetch', onFetch);
//删除版本不一致的缓存
self.addEventListener("activate", onActivate);
//安装PWA缓存结束--------
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
