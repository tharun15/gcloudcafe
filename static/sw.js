/**
 * GCloud Cafe High-Performance Service Worker
 * Implements CacheFirst for immutable assets (fonts, css, js, images) and NetworkFirst for HTML.
 */

const CACHE_NAME = gcloudcafe-v2.1;
const STATIC_ASSETS = [
  /,
  /fonts/fa-solid-900.woff2,
  /fonts/fa-brands-400.woff2,
  /fonts/fa-regular-400.woff2,
  /images/logo.png,
  /images/logo-darkmode.png,
  /images/favicon.png
];

self.addEventListener(install, (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn(SW
