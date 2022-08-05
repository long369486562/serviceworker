// 修改默认配置
workbox.core.setCacheNameDetails({
    prefix: 'app',
    suffix: 'v1',
    precache: 'precache',
    runtime: 'runtime'
  })
  
  // 打印修改结果
  
  // 将打印 'app-precache-v1'
  console.log(worbox.core.cacheNames.precache)
  // 将打印 'app-runtime-v1'
  console.log(workbox.core.cacheNames.runtime)