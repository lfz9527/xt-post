interface CreateIdGenerator {
  prefix?: string
  separator?: string
  size?: number
  alphabet?: string
}
/**
  创建ID生成器。
  ID的总长度是前置符、分隔符和随机部分长度的总和。
  加密不安全。
  @param alphet-ID使用的字母。默认：“0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz”。
  @param prefuse-要生成的ID的prefuse。可选的.
  @param分隔符-前置符和ID的随机部分之间的分隔符。默认：“-”。
  @param size -要生成的ID随机部分的大小。默认：16。
 */
export const createIdGenerator = ({
  prefix,
  size = 16,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  separator = '-',
}: CreateIdGenerator) => {
  const generator = () => {
    const alphabetLength = alphabet.length
    const chars = new Array(size)
    for (let i = 0; i < size; i++) {
      chars[i] = alphabet[(Math.random() * alphabetLength) | 0]
    }
    return chars.join('')
  }

  if (prefix == null) {
    return generator
  }

  // 检查前缀是否和 随机部分一致,如果一致则异常错误
  if (alphabet.includes(separator)) {
    throw new Error(`分隔符 "${separator}" 不能包含在字母表 "${alphabet}" 中。`)
  }

  return () => `${prefix}${separator}${generator()}`
}
export const generateId = createIdGenerator({})


export function mergeObject<T>(target: T, source: any): T {
  return {
    ...target,
    ...source,
  } as T
}


export const logger = (key: string, data?: any) => {
  console.group(`${key}`)
  if (data) {
    console.log(data)
  }
  console.groupEnd()
}