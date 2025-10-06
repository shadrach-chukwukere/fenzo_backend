import webpush from "web-push";

// 🔑 Your VAPID keys (generate with npx web-push generate-vapid-keys)
const publicVapidKey =
  "BF0KqxxxMad49dW6-aLczLeBRMzqvp1-n3f2yrKFIqZ4DTy2BCnN0bQGwo7gZVtnqJS4ivJBq6Jhxw3OJ3LfHbo";
const privateVapidKey = "VjAcGzlaEo5k1N8_AVeZdiVW56d_eBmEUVW_TU37B64";

// Setup VAPID details once
webpush.setVapidDetails(
  "mailto:chispecialshadrach@gmail.com",
  publicVapidKey,
  privateVapidKey
);

// Store subscriptions in memory (in production, use DB)
let subscriptions = [];

/**
 * Save subscription from client
 */
export function addSubscription(subscription) {
  subscriptions.push(subscription);
}

/**
 * Send push notification to all subscribers
 */
export async function sendPushNotification(payload = {}) {
  const data = JSON.stringify({
    title: payload.title || "🚀 Hello",
    body: payload.body || "This is a push notification!",
    icon: payload.icon || "/icon.png",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(sub, data).catch((err) => {
        console.error("Push error:", err);
      })
    )
  );

  return results;
}
