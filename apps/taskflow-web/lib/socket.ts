import { io, Socket } from 'socket.io-client';

let stocksSocket: Socket | null = null;
let cryptoSocket: Socket | null = null;

const RTL_URL = process.env.NEXT_PUBLIC_BACKEND_RTL_URL;

export const getStocksSocket = (token: string): Socket => {
  if (!stocksSocket) {
    stocksSocket = io(`${RTL_URL}/stocks`, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { token },
    });
  } else {
    stocksSocket.auth = { token };
  }

  if (!stocksSocket.connected) {
    stocksSocket.connect();
  }

  return stocksSocket;
};

export const getCryptoSocket = (token: string): Socket => {
  if (!cryptoSocket) {
    cryptoSocket = io(`${RTL_URL}/crypto`, {
      transports: ['websocket'],
      autoConnect: false,
      auth: { token },
    });
  } else {
    cryptoSocket.auth = { token };
  }

  if (!cryptoSocket.connected) {
    cryptoSocket.connect();
  }

  return cryptoSocket;
};

export const disconnectAllSockets = () => {
  if (stocksSocket) {
    stocksSocket.disconnect();
    stocksSocket = null;
  }
  if (cryptoSocket) {
    cryptoSocket.disconnect();
    cryptoSocket = null;
  }
};
