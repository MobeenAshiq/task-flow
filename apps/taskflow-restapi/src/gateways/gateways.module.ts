import { Module, Global } from '@nestjs/common';
import { SubmissionsGateway } from './submissions.gateway';
import { CryptoTickerGateway, StockTickerGateway } from './ticker.gateway';

@Global()
@Module({
  providers: [SubmissionsGateway, CryptoTickerGateway, StockTickerGateway],
  exports: [SubmissionsGateway, CryptoTickerGateway, StockTickerGateway],
})
export class GatewaysModule {}
