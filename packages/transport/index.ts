import { Message } from "@/types";
import { ITransport } from "./types";
import { generateId } from "@/utils";



export class Transport implements ITransport {
  private listener: ((data: string) => void) | null = null;
  private readonly handleMessageBound: (e: MessageEvent<string>) => void;
  private target: Window | WindowProxy = window

  constructor(
    target: Window | WindowProxy = window,
    private role: string,
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
      window.addEventListener('message', this.handleMessageBound);
    } catch (error) {
      this.handleMessageBound = () => { }
      console.error(error)
    }
  }

  // 发送消息
  send(data: string): void {
    if (this.debug) {
      this.log('发送消息', data)
    }
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
      this.log(`通信销毁`);
    }
  }

  private handleMessage(event: MessageEvent<string>): void {
    const { data, origin, source } = event;
    if (!this.listener) return
    if (this.origin !== '*' && origin !== this.origin) return;
    if (source !== this.target) return;
    if (this.debug) {
      this.log('接收消息', data)
    }
    this.listener(data);
  }

  private log(key: string, data?: Message | string): void {
    console.group(`[transport]_[${this.origin}]_[${this.role}] [${this.id}] ${key}`)
    console.log(data)
    console.groupEnd()
  }
}