const { Server } = require("socket.io");

let io;
const userIdToSockets = new Map();

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    const userId =
      socket.handshake.auth?.userId || socket.handshake.query?.userId;
    if (userId) {
      const existing = userIdToSockets.get(userId) || new Set();
      existing.add(socket.id);
      userIdToSockets.set(userId, existing);
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", () => {
      if (!userId) return;
      const existing = userIdToSockets.get(userId);
      if (existing) {
        existing.delete(socket.id);
        if (existing.size === 0) userIdToSockets.delete(userId);
        else userIdToSockets.set(userId, existing);
      }
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser };
