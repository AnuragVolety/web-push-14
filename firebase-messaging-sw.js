self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Received notificationclick event ', event);
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  var raw = JSON.stringify({
    "eventName": "clicked",
    "properties": {
      "openedAt": new Date().toISOString()
    },
    "storeUrl": self.location.host,
    "broadcastId": event.notification.data.broadcastId,
    "customerId": event.notification.data.customerId
  });

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };

  fetch("http://localhost:8080/webPushApiFunctions-captureEvent", requestOptions)
    .then(response => response.text())
    .catch(error => console.log('error', error));
  if (!event.action) {
    var click_action = event.notification.data.url || event.notification.data;
    event.notification.close();
    event.waitUntil(clients.matchAll({
      type: 'window'
    }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == click_action && 'focus' in client) { return client.focus(); }
      }
      if (clients.openWindow) { return clients.openWindow(click_action); }
    }));
    return;
  }

  clients.openWindow(event.action);

});

importScripts('/__/firebase/9.2.0/firebase-app-compat.js');
importScripts('/__/firebase/9.2.0/firebase-messaging-compat.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const actions = JSON.parse(payload.data['actions']);
  const broadcastId = parseInt(payload.data['broadcast_id']);
  const customerId = parseInt(payload.data['customer_id']);

  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: payload.data.icon,
    title: payload.data.title,
    data: { url: payload.data.click_action, broadcastId, customerId },
    actions,
  };

  if (!actions) {
    if (!("Notification" in window)) {
      console.log("This browser does not support system notifications.");
    } else if (Notification.permission === "granted") {
      var notification = new Notification(notificationTitle, notificationOptions);
      notification.onclick = function (event) {
        event.preventDefault();
        clients.openWindow(payload.fcmOptions.link, '_blank');
        notification.close();
      }
    }
    return;
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
