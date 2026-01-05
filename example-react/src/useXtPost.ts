import { useEffect, useRef } from 'react'

type XtPostAction = {
  // 父iframe 发送事件给子iframe
  emit<T = any>(action: string, payload?: T): void
  // 子iframe 监听事件
  on<T = any>(action: string, cb: (payload: T) => void): void
  // 销毁
  destroy: VoidFunction
  // 暴露方法给子iframe 调用
  expose<T = any, R = any>(
    action: string,
    handler: (payload: T) => R | Promise<R>
  ): void

  // 子iframe 调用父iframe 暴露的方法
  call<T = any, R = any>(action: string, payload?: T): Promise<R>
}

type Props = {
  // 是否自动注册
  autoRegister?: boolean
  // 是否开启调试模式
  debug?: boolean
  // 容器元素
  container?: HTMLIFrameElement
  // 指定目标窗口URL
  targetUrl?: string
  // 超时
  timeout?: number
  // 注册通信id
  id: string
  // 源目标一致时，通过iframeId 去判断
  iframeId: string

  // 子iframe 准备就绪时调用
  onReady?: (cb: () => void) => void
}

export const useXtPost = ({ onReady, ...props }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const xtPostRef = useRef<Partial<XtPostAction> | null>(null)

  useEffect(() => {
    // 防止重复注册
    if (xtPostRef.current) return
    if (!iframeRef.current) return

    const xtPost = new window.XtPost({
      debug: isDev(),
      container: iframeRef.current,
      ...props,
    })
    xtPostRef.current = xtPost

    console.log('111111', xtPost)

    xtPost.onReady?.(onReady)

    return () => {
      xtPost.destroy()
      xtPostRef.current = null
    }
  }, [props])

  return {
    expose: xtPostRef.current?.expose,
    emit: xtPostRef.current?.emit,
    call: xtPostRef.current?.call,
    on: xtPostRef.current?.on,
    destroy: xtPostRef.current?.destroy,
    xtPost: xtPostRef.current,
    iframeRef,
  }
}
