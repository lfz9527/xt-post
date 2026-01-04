import { type Message } from '../types'


export type ProtocolMessage = Message
export interface ImpProtocol {
  /** 将 SDK 消息编码成 Transport 可发送的原始对象 */
  encode(msg: ProtocolMessage): any;

  /** 将 Transport 接收到的原始对象解码成 SDK 消息 */
  decode(raw: any): ProtocolMessage | null;

  /** 校验消息是否合法 */
  validate(msg: ProtocolMessage): boolean;

  /** 协议版本 */
  version: string;
}
