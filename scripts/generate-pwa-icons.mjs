import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')
const sourcePng = join(iconsDir, 'source.png')
const input = sourcePng

const logoBg = { r: 255, g: 255, b: 255, alpha: 1 }

const outputs = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512, maskable: true },
]

async function squareIcon(size, { maskable = false } = {}) {
  const pad = maskable ? Math.round(size * 0.12) : Math.round(size * 0.06)
  const inner = size - pad * 2
  const innerBuf = await sharp(input)
    .resize(inner, inner, { fit: 'contain', background: logoBg })
    .png()
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: logoBg },
  }).composite([{ input: innerBuf, left: pad, top: pad }])
}

async function main() {
  if (!existsSync(sourcePng)) {
    console.error('Missing public/icons/source.png')
    process.exit(1)
  }
  for (const { file, size, maskable } of outputs) {
    const img = await squareIcon(size, { maskable })
    await img.png().toFile(join(iconsDir, file))
    console.log(`wrote ${file} (${size}px)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
