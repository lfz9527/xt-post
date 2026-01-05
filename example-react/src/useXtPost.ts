import { useEffect, useRef, useState, useCallback } from 'react'
import XtPost from "xt-post";


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
}

type Action = {
  // 子iframe 准备就绪时调用
  onReady?: VoidFunction
  // 暴露出去的方法
  exposes?: Record<string, (...args: any[]) => void>
  on?: Record<string, (...args: any[]) => void>
}

export const useXtPost = ({ onReady, exposes, on, ...props }: Props & Action) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const xtPostRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // 防止重复注册
    if (xtPostRef.current) return
    if (!iframeRef.current) return
    const xtPost = new XtPost({
      debug: true,
      container: iframeRef.current,
      ...props,
    } as any)
    xtPostRef.current = xtPost

    xtPost.onReady?.(() => {
      setReady(true)
      onReady?.()
    })

    // 注册 expose
    Object.entries(exposes ?? {}).forEach(
      ([action, handler]) => {
        xtPost.expose(action, handler)
      }
    )

    // on（事件监听）
    Object.entries(on ?? {}).forEach(
      ([action, handler]) => {
        xtPost.on(action, handler)
      }
    )

    return () => {
      xtPost.destroy()
      xtPostRef.current = null
      setReady(false)
    }
  }, [])

  console.log(props.id, xtPostRef.current)

  const call = useCallback(
    (action: string, payload?: any) => {
      return xtPostRef.current?.call?.(action, payload)
    },
    []
  )

  const emit = useCallback(
    (action: string, payload?: any) =>
      xtPostRef.current!.emit?.(action, payload),
    []
  )


  return {
    ready,
    iframeRef,
    call,
    emit,
  }
}
