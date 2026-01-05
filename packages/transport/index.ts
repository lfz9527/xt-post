import { ITransport } from "./types";
import { generateId, logger } from "../utils";



export class Transport implements ITransport {
  private listener: ((data: string) => void) | null = null;
  private readonly handleMessageBound: (e: MessageEvent<string>) => void;
  private target: Window | WindowProxy = window

  constructor(
    target: Window | WindowProxy = window,
    private origin: string = '*',
    private debug: boolean = false,
    private id = generateId()
  ) {
    try {
      if (!this.target) {
        throw new Error("目标iframe 不能为空")
      }
      this.target = target
      // 绑定一次，保证 destroy 可移除
      this.handleMessageBound = this.handleMessage.bind(this);
      if (this.debug) {
        logger(`[transport]_${this.id} 通信初始化`)
      }
      window.addEventListener('message', this.handleMessageBound);
    } catch (error) {
      this.handleMessageBound = () => { }
      console.error(error)
    }
  }

  // 发送消息
  send(data: string): void {
    this.target.postMessage(data, this.origin);
  }
  // 接收消息
  onMessage(cb: (data: string) => void): void {
    this.listener = cb;
  }
  // 销毁
  destroy(): void {
    this.listener = null;
    window.removeEventListener('message', this.handleMessageBound)
    if (this.debug) {
      logger(`[transport]_${this.id} 通信销毁`);
    }
  }

  private handleMessage(event: MessageEvent<string>): void {
    const { data, origin, source } = event;
    if (!this.listener) return
    if (this.origin !== '*' && origin !== this.origin) return;
    if (source !== this.target) return;
    if (typeof data === 'string' && this.debug && data.includes('xt-post')) {
      logger(`[transport]_${this.origin}_${this.id}_handleMessage 接收消息`, event)
    }
    this.listener(data);
  }
}