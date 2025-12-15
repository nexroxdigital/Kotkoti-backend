import 'socket.io';

declare module 'socket.io' {
  interface Socket {
    data: {
      user?: {
        userId: string;
        nickName: string;
        role: 'HOST' | 'ADMIN' | 'GUEST';
      };
    };
  }
}
