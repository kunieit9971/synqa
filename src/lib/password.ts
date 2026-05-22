import { sha256Hex } from './sha256'

export async function hashPassword(plain: string): Promise<string> {
  return sha256Hex(plain)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash.trim()) return false
  return (await hashPassword(plain)) === hash.trim()
}
