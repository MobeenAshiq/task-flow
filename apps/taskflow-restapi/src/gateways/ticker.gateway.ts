import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'crypto',
  cors: { origin: '*' },
})
export class CryptoTickerGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CryptoTickerGateway.name);

  @SubscribeMessage('subscribe_ticker')
  handleSubscribeTicker(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    const room = `ticker:${data.symbol.toUpperCase()}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to crypto ${room}`);
    return { event: 'subscribed', symbol: data.symbol };
  }

  broadcastPriceUpdate(symbol: string, priceData: any) {
    this.server.to(`ticker:${symbol.toUpperCase()}`).emit('price_update', priceData);
  }
}

@WebSocketGateway({
  namespace: 'stocks',
  cors: { origin: '*' },
})
export class StockTickerGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StockTickerGateway.name);

  @SubscribeMessage('subscribe:stock')
  handleSubscribeStock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticker: string },
  ) {
    const room = `stock:${data.ticker.toUpperCase()}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to stock ${room}`);
    return { event: 'subscribed', ticker: data.ticker };
  }

  @SubscribeMessage('unsubscribe:stock')
  handleUnsubscribeStock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticker: string },
  ) {
    const room = `stock:${data.ticker.toUpperCase()}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from stock ${room}`);
  }

  broadcastPriceUpdate(ticker: string, priceData: any) {
    this.server.to(`stock:${ticker.toUpperCase()}`).emit('stock:price_update', priceData);
  }
}
