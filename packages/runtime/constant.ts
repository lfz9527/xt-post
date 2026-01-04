export enum ConnectionState {
  INIT,  // 初始化
  CONNECTING, // 握手中
  CONNECTED,   // 握手完成
  READY        // 子端 ready
}