import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'submissions',
  cors: { origin: '*' },
})
export class SubmissionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SubmissionsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to /submissions: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from /submissions: ${client.id}`);
  }

  @SubscribeMessage('join_submission')
  handleJoinSubmission(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { submissionId: string },
  ) {
    const room = `submission:${data.submissionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);

    return { event: 'joined_room', data: { room } };
  }

  @SubscribeMessage('leave_submission')
  handleLeaveSubmission(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { submissionId: string },
  ) {
    const room = `submission:${data.submissionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }

  // Method called by worker/service to emit status updates to room subscribers
  emitSubmissionUpdate(submissionId: string, payload: any) {
    this.server.to(`submission:${submissionId}`).emit('submission_updated', payload);
  }
}
