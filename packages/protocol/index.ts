import { ImpProtocol, ProtocolMessage } from './types'

export class Protocol implements ImpProtocol {
  version = "1.0.0"
  private static readonly SDK = 'xt-post'

  constructor(
    private debug = false,
    private id: string
  ) { }

  /** 编码 */
  encode(msg: ProtocolMessage): string {
    // 保证带上 sdk 标识和版本 并且序列化
    const data = {
      ...msg,
      sdk: Protocol.SDK,
      version: this.version,
    };
    return JSON.stringify(data)
  }


  /** 解码 */
  decode(raw: any): ProtocolMessage | null {
    try {
      const msg: ProtocolMessage = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!this.validate(msg)) return null;
      return msg;
    } catch (e) {
      if (this.debug) {
        this.log('协议解码错误', raw)
      }
      return null;
    }
  }

  /** 校验消息是否合法 */
  validate(msg: ProtocolMessage): boolean {
    if (!msg) return false;
    // 校验sdk标识符是否匹配
    if (msg.sdk !== Protocol.SDK) return false;
    if (!msg.type || !msg.action) return false;
    if ((msg.type === 'request' || msg.type === 'response') && !msg.messageId) return false;
    return true;
  }
  private log(key: string, data?: ProtocolMessage): void {
    console.group(`[protocol] [${this.id}] ${key}`)
    console.log(data)
    console.groupEnd()
  }
}