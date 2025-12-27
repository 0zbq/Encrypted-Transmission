// 简单自定义“加密”，不使用任何机密/浏览器加密 API（仅用于学习演示，**不安全**）

const encoder = typeof TextEncoder !== 'undefined'
  ? new TextEncoder()
  : {
      encode(str) {
        const utf8 = unescape(encodeURIComponent(str))
        const arr = new Uint8Array(utf8.length)
        for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i)
        return arr
      },
    }

export function randomBytes(len) {
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    arr[i] = Math.floor(Math.random() * 256)
  }
  return arr
}

export function base64Encode(uint8) {
  const view = uint8 instanceof Uint8Array ? uint8 : new Uint8Array(uint8)
  return wx.arrayBufferToBase64(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength))
}

export function base64Decode(b64) {
  const ab = wx.base64ToArrayBuffer(b64)
  return new Uint8Array(ab)
}

// 非安全的简单 KDF：password + salt 混合生成 32 字节 key
function deriveSimpleKey(password, salt) {
  const pwdBytes = encoder.encode(password)
  const saltBytes = salt instanceof Uint8Array ? salt : new Uint8Array(salt || 0)
  const key = new Uint8Array(32)
  const pLen = pwdBytes.length || 1
  const sLen = saltBytes.length || 1
  let acc = 0
  for (let i = 0; i < 32; i++) {
    const p = pwdBytes[i % pLen]
    const s = saltBytes[i % sLen]
    acc = (acc + p + s + i * 17) & 0xff
    key[i] = acc
  }
  return key
}

export async function importAesKey(rawBytes) {
  const raw = rawBytes instanceof Uint8Array ? rawBytes : new Uint8Array(rawBytes)
  return { rawKey: raw }
}

export async function deriveKeyFromPassword(password, salt) {
  const rawKey = deriveSimpleKey(password, salt)
  return { rawKey }
}

// 简单 XOR 变换：同一函数用于加密和解密
function xorTransform(input, key, iv) {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input)
  const k = key instanceof Uint8Array ? key : new Uint8Array(key)
  const v = iv instanceof Uint8Array ? iv : new Uint8Array(iv)
  const kLen = k.length || 1
  const vLen = v.length || 1
  const out = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ k[i % kLen] ^ v[i % vLen]
  }
  return out
}

export async function encryptBuffer(buffer, keyObj, iv) {
  const cipher = xorTransform(buffer, keyObj.rawKey, iv)
  return { cipher: cipher, hmacBase64: '' }
}

export async function decryptBuffer(buffer, keyObj, iv) {
  const plain = xorTransform(buffer, keyObj.rawKey, iv)
  return plain
}

