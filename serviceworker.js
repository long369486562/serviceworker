'use strict';
//缓存版本号，随着页面的更改，如果要更新缓存，请修改这里的版本号
const version = 'v20190214';
const __DEVELOPMENT__ = false;
const __DEBUG__ = false;
//配置两个离线用资源
const offlineResources = ['/'];
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
      return Cache.addAll(offlineResources);
    })
    .then(() => {
      log('installation complete!');
    });
}
//更新动态缓存
function onFetch(event) {
  const request = event.request;
  if (shouldAlwaysFetch(request)) {
    event.respondWith(networkedOrOffline(request));
    return;
  } if (shouldFetchAndCache(request)) {
    event.respondWith(networkedOrCached(request));
    return;
  }
  event.respondWith(cachedOrNetworked(request));
}
function networkedOrCached(request) {
  return networkedAndCache(request)
    .catch(() => {
      return cachedOrOffline(request)
    });
}
function networkedAndCache(request) {
  return fetch(request).then((response) => {
    var copy = response.clone();
    caches.open(cacheKey('resources')).then((cache) => { cache.put(request, copy); });
    log("(network: cache write)", request.method, request.url); return response;
  });
}
function cachedOrNetworked(request) {
  return caches.match(request)
    .then((response) => {
      log(response ? '(cached)' : '(network: cache miss)', request.method, request.url);
      return response || networkedAndCache(request)
        .catch(() => {
          return offlineResponse(request)
        });
    });
}
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
function cachedOrOffline(request) {
  return caches.match(request)
    .then((response) => {
      return response || offlineResponse(request);
    });
}
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
function shouldAlwaysFetch(request) {
  return __DEVELOPMENT__ || request.method !== 'GET' || ignoreFetch.some(regex => request.url.match(regex));
}
function shouldFetchAndCache(request) {
  return ~request.headers.get('Accept').indexOf('text/html');
}
function developmentMode() {
  return __DEVELOPMENT__ || __DEBUG__;
}
log("Hello from ServiceWorker land!", version);
self.addEventListener('install', onInstall);
self.addEventListener('fetch', onFetch);
self.addEventListener("activate", onActivate);
