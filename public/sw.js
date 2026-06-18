// Service Worker for handling Web Push notifications

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event received with no data payload.");
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    // Fallback to text payload if not JSON
    data = {
      title: "GoalHyke Alert",
      body: event.data.text()
    };
  }

  const title = data.title || "New Update from GoalHyke! 🚀";
  const options = {
    body: data.body || "Stay on track and achieve your streaks.",
    icon: "/images/goalhyke.png", // fallback or main brand icon
    badge: "/images/goalhyke.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.metadata?.url || "/dashboard",
      metadata: data.metadata || {}
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if a tab with this URL is already open
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
