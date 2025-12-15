import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private roomChatState = new Map<string, { mode: "ALL" | "SEAT_ONLY" | "LOCKED" }>();

  private getState(roomId: string) {
    if (!this.roomChatState.has(roomId)) {
      this.roomChatState.set(roomId, { mode: "ALL" });
    }
    return this.roomChatState.get(roomId)!;
  }

  // ---------------------------
  // SEND MESSAGE
  // ---------------------------
  @SubscribeMessage("chat.send")
  async onSend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; message: string }
  ) {
    const { roomId, message } = body;
    const user = socket.data.user;

    const state = this.getState(roomId);

    if (state.mode === "LOCKED") {
      socket.emit("chat.error", { message: "Chat is locked" });
      return;
    }

    if (state.mode === "SEAT_ONLY") {
      const isSeated = await this.isUserOnSeat(roomId, user.userId);
      if (!isSeated) {
        socket.emit("chat.error", { message: "Seat users only" });
        return;
      }
    }

    this.server.to(roomId).emit("chat.message", {
      userId: user.userId,
      nickName: user.nickName,
      message,
      ts: Date.now(),
    });
  }

  // ---------------------------
  // CHANGE MODE (Host/Admin)
  // ---------------------------
  @SubscribeMessage("chat.setMode")
  async setMode(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string; mode: "ALL" | "SEAT_ONLY" | "LOCKED" }
  ) {
    if (!(await this.isHostOrAdmin(socket, body.roomId))) return;

    const state = this.getState(body.roomId);
    state.mode = body.mode;

    this.server.to(body.roomId).emit("chat.modeChanged", {
      mode: body.mode,
    });
  }

  // ---------------------------
  // CLEAR CHAT (Host/Admin)
  // ---------------------------
  @SubscribeMessage("chat.clear")
  async clearChat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string }
  ) {
    if (!(await this.isHostOrAdmin(socket, body.roomId))) return;

    this.server.to(body.roomId).emit("chat.cleared");
  }

  // ---------------------------
  // HELPERS
  // ---------------------------
  private async isHostOrAdmin(socket: Socket, roomId: string) {
    const user = socket.data.user;
    return user.role === "HOST" || user.role === "ADMIN";
  }

  private async isUserOnSeat(roomId: string, userId: string) {
    // check seats table or in-memory seat state
    return true; // implement with your seat service
  }
}
