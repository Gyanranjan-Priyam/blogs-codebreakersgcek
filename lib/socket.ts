import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

// Get the Socket.IO instance
export function getIO(): SocketIOServer | null {
  if (typeof window !== "undefined") return null;
  
  try {
    const io = (global as any).io as SocketIOServer;
    return io || null;
  } catch {
    return null;
  }
}

// Emit socket events
export function emitSocketEvent(event: string, data: any) {
  const io = getIO();
  if (io) {
    io.emit(event, data);
  }
}
