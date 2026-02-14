const socketIo = require('socket.io');

let io;
const userSockets = new Map(); // userId -> Set of socketIds

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Adjust this in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        socket.on('authenticate', (userId) => {
            if (userId) {
                if (!userSockets.has(userId)) {
                    userSockets.set(userId, new Set());
                }
                userSockets.get(userId).add(socket.id);
                socket.userId = userId;
                console.log(`Socket ${socket.id} authenticated for user ${userId}`);
            }
        });

        socket.on('disconnect', () => {
            if (socket.userId && userSockets.has(socket.userId)) {
                userSockets.get(socket.userId).delete(socket.id);
                if (userSockets.get(socket.userId).size === 0) {
                    userSockets.delete(socket.userId);
                }
            }
            console.log(`Socket ${socket.id} disconnected`);
        });
    });

    return io;
};

const emitNotification = (userId, notification) => {
    if (!io) {
        console.warn('[SocketDebug] IO not initialized');
        return;
    }

    if (userSockets.has(userId.toString())) {
        const sockets = userSockets.get(userId.toString());
        console.log(`[SocketDebug] Emitting notification to user ${userId} (${sockets.size} sockets)`);
        sockets.forEach(socketId => {
            io.to(socketId).emit('notification', notification);
        });
    } else {
        console.warn(`[SocketDebug] No active sockets found for user ${userId}. Available users: ${Array.from(userSockets.keys()).join(', ')}`);
    }
};

const emitToAllStaff = (notification) => {
    if (!io) return;
    // For now, we can emit to a room 'staff' if we stick users there, 
    // but a simple broadcast for simplicity in this project
    io.emit('admin_notification', notification);
};

module.exports = {
    initSocket,
    emitNotification,
    emitToAllStaff
};
