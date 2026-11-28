/*
 * Service Worker der Familien-App: nur für Push-Benachrichtigungen (kein Offline-Cache).
 * Liegt im Hauptordner, damit er für alle Seiten der App gilt.
 * Nachricht vom Server (push/senden.js): { titel, text, url, tag }
 */
"use strict";

self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", function (e) {
  var n = {};
  try { n = e.data ? e.data.json() : {}; } catch (x) { n = { text: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(n.titel || "Familie", {
    body: n.text || "",
    tag: n.tag || undefined,
    icon: "gemeinsam/icons/icon-192.png",
    badge: "gemeinsam/icons/icon-192.png",
    data: { url: new URL(n.url || "./", self.registration.scope).href }
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var ziel = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (fenster) {
    for (var i = 0; i < fenster.length; i++) {
      if (fenster[i].url.indexOf(self.registration.scope) === 0 && "focus" in fenster[i]) {
        return fenster[i].navigate(ziel).then(function (f) { return (f || fenster[i]).focus(); }).catch(function () { return fenster[i].focus(); });
      }
    }
    return self.clients.openWindow(ziel);
  }));
});
