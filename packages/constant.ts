
import { Options } from './types'

export const defaultOptions: Partial<Options> = {
  // 默认自动注册
  autoRegister: true,
  // 默认关闭调试模式
  debug: false,
  // 默认超时时间 5s
  timeout: 5000,
}


export enum EventName {
  READY = '__ready__',
}
