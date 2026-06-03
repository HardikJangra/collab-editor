let ioInstance = null;

const setIo = (io) => {
  ioInstance = io;
};

const emitToRoom = (room, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
};

const emitToSocket = (socketId, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(socketId).emit(event, payload);
};

module.exports = {
  setIo,
  emitToRoom,
  emitToSocket,
};
