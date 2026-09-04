'use client';

import { useEffect, useState } from 'react';
import { getStocksSocket } from '@/lib/socket';

export interface StockPriceData {
  ticker: string;
  price: number;
  change?: number;
  timestamp?: number;
  [key: string]: unknown;
}

export function useStockRealTime(ticker: string, userToken: string) {
  const [priceData, setPriceData] = useState<StockPriceData | null>(null);

  useEffect(() => {
    if (!userToken || !ticker) return;

    const socket = getStocksSocket(userToken);

    socket.emit('subscribe:stock', { ticker });

    const handlePriceUpdate = (data: StockPriceData) => {
      if (data.ticker === ticker) {
        setPriceData(data);
      }
    };

    socket.on('stock:price_update', handlePriceUpdate);

    return () => {
      socket.emit('unsubscribe:stock', { ticker });
      socket.off('stock:price_update', handlePriceUpdate);
    };
  }, [ticker, userToken]);

  return priceData;
}
