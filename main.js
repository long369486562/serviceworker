(function () {
    window.addEventListener('load', function () {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register("./sw.js").then(function (registration) {
            console.log('Service Worker Registered,register script: serviceworker.js.');
          }).catch(function (error) {
            // registration failed
            console.log('Registration failed with ' + error);
          });
        }
      })
  })();