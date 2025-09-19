import { Server } from "socket.io";
import http from "http";

// your existing Express app
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Map to store connected sockets by userId
const userSockets = new Map();

// WebSocket connection
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // client sends their userId on connect
  socket.on("register", (userId) => {
    userSockets.set(userId, socket);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    for (const [uid, s] of userSockets.entries()) {
      if (s.id === socket.id) userSockets.delete(uid);
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Function to notify a user
export const notifyUser = async (userId, payload) => {
  // 1️⃣ Send via WebSocket if connected
  const socket = userSockets.get(userId);
  if (socket) socket.emit("notification", payload);

  // 2️⃣ Send via Push if subscription exists
  const sub = subscriptions.find((s) => s.userId === userId)?.subscription;
  if (sub) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err) {
      console.error("Push error:", err);
    }
  }
};

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
