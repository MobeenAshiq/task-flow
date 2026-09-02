'use client';

import { useEffect, useState } from 'react';
import { getStocksSocket } from '@/lib/socket';

export function useStockRealTime(ticker: string, userToken: string) {
  const [priceData, setPriceData] = useState<any>(null);

  useEffect(() => {
    if (!userToken || !ticker) return;

    const socket = getStocksSocket(userToken);

    socket.emit('subscribe:stock', { ticker });

    const handlePriceUpdate = (data: any) => {
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
