export function phonePlatform(userAgent = navigator.userAgent, platform = navigator.platform, touchPoints = navigator.maxTouchPoints) {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

export function isAppWindow() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export async function registerMobileApp(onReady) {
  if (!('serviceWorker' in navigator) || !window.isSecureContext || !/^https?:$/.test(location.protocol)) return;
  const registration = await navigator.serviceWorker.register(new URL('./sw.js', document.baseURI), { scope: './' });
  // An updated version waits until the next app launch, avoiding a reload while
  // the learner is answering or talking. Cache completion makes this reliable.
  await navigator.serviceWorker.ready;
  onReady?.(registration);
  return registration;
}
