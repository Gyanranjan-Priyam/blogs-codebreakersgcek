import { NextRequest, NextResponse } from "next/server";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

let io: SocketIOServer | undefined;

export async function GET(request: NextRequest) {
  if (!io) {
    // Initialize Socket.IO server
    const httpServer = (global as any).httpServer as NetServer;
    
    if (!httpServer) {
      return NextResponse.json(
        { error: "Socket.IO not initialized" },
        { status: 500 }
      );
    }

    io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    console.log("Socket.IO server initialized");
  }

  return NextResponse.json({ message: "Socket.IO server running" });
}
