import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = join(__dirname, '../public/icon-ios.svg')
const outPath = join(__dirname, '../public/icon-ios.png')

const svg = readFileSync(svgPath)

await sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(outPath)

console.log('✅ icon-ios.png generado en public/')
