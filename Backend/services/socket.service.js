const connectedUsers = new Map(); // userId -> socketId mapping

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      // Register user
      socket.on('register', (userId) => {
        connectedUsers.set(userId.toString(), socket.id);
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        for (let [userId, socketId] of connectedUsers.entries()) {
          if (socketId === socket.id) {
            connectedUsers.delete(userId);
            console.log(`👋 User ${userId} disconnected`);
            break;
          }
        }
      });
    });
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    const socketId = connectedUsers.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`📡 Emitted '${event}' to user ${userId}`);
      return true;
    } else {
      console.log(`⚠️ User ${userId} not connected`);
      return false;
    }
  }

  // Emit to multiple users
  emitToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📢 Broadcasted '${event}' to all users`);
    }
  }

  // Get connected users count
  getConnectedUsersCount() {
    return connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return connectedUsers.has(userId.toString());
  }
}

module.exports = new SocketService();