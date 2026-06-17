/*
App Title: Dominoes
Credits: Tre Thacker
Year Created: 2026
Version: 1.10
Dedication: None
*/

/* <------------------------------------------------
      SERVICE WORKER CACHE SETTINGS
   -------------------------------------------------> */
const CACHE_NAME = "dominoes-cache-v1-10";

const CORE_ASSETS = [
	"./",
	"./index.html",
	"./styles.css",
	"./app.js",
	"./manifest.json",
	"./image/icon/icon-16.png",
	"./image/icon/icon-32.png",
	"./image/icon/icon-180.png",
	"./image/icon/icon-192.png",
	"./image/icon/icon-512.png",
	"./image/icon/icon-512.webp"
];

/* <------------------------------------------------
      INSTALL APP CACHE
   -------------------------------------------------> */
self.addEventListener("install", event => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then(cache => cache.addAll(CORE_ASSETS))
			.then(() => self.skipWaiting())
	);
});

/* <------------------------------------------------
      ACTIVATE CURRENT CACHE
   -------------------------------------------------> */
self.addEventListener("activate", event => {
	event.waitUntil(
		caches
			.keys()
			.then(cacheNames =>
				Promise.all(
					cacheNames
						.filter(cacheName => cacheName !== CACHE_NAME)
						.map(cacheName => caches.delete(cacheName))
				)
			)
			.then(() => self.clients.claim())
	);
});

/* <------------------------------------------------
      FETCH CACHED FILES
   -------------------------------------------------> */
self.addEventListener("fetch", event => {
	if (event.request.method !== "GET") {
		return;
	}

	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(event.request).then(networkResponse => {
				if (
					!networkResponse ||
					networkResponse.status !== 200 ||
					networkResponse.type !== "basic"
				) {
					return networkResponse;
				}

				const responseToCache = networkResponse.clone();

				caches.open(CACHE_NAME).then(cache => {
					cache.put(event.request, responseToCache);
				});

				return networkResponse;
			});
		})
	);
});