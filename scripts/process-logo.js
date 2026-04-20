const sharp = require('sharp')
const path = require('path')

async function processMask(inputPath, outputPath) {
  const meta = await sharp(inputPath).metadata()
  const stats = await sharp(inputPath).stats()

  // Detect how the letter shapes are encoded:
  //   - If the image has a real alpha channel with variation, letters are
  //     encoded in alpha (e.g. transparent PNG with black text).
  //   - Otherwise they're encoded in luminance (dark ink on a light/colored
  //     background), so we invert the luma and threshold.
  const alphaCh = stats.channels[3]
  const useAlpha = meta.hasAlpha && alphaCh && alphaCh.max > alphaCh.min

  let mask
  if (useAlpha) {
    mask = await sharp(inputPath)
      .extractChannel('alpha')
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true })
  } else {
    mask = await sharp(inputPath)
      .greyscale()
      .negate({ alpha: false })
      .threshold(128)
      .raw()
      .toBuffer({ resolveWithObject: true })
  }

  const masked = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 235, g: 235, b: 245 },
    },
  })
    .joinChannel(mask.data, {
      raw: { width: meta.width, height: meta.height, channels: 1 },
    })
    .png()
    .toBuffer()

  await sharp(masked).trim({ threshold: 1 }).png().toFile(outputPath)
  const outMeta = await sharp(outputPath).metadata()
  console.log(`Wrote ${outputPath}  (${outMeta.width}x${outMeta.height}) [${useAlpha ? 'alpha' : 'luma'}]`)
  return { masked, meta }
}

async function main() {
  const input = path.join(__dirname, '..', 'public', 'rwn-logo.png')
  const output = path.join(__dirname, '..', 'public', 'rwn-logo-mono.png')
  const faviconOut = path.join(__dirname, '..', 'app', 'icon.png')
  const headerInput = path.join(__dirname, '..', 'public', 'header-light-mode.png')
  const headerOutput = path.join(__dirname, '..', 'public', 'header-logo-mono.png')

  const meta = await sharp(input).metadata()

  // Build alpha mask: invert luminance so letters (originally dark) become bright,
  // then threshold so the result is fully opaque letters / fully transparent bg.
  const mask = await sharp(input)
    .greyscale()
    .negate({ alpha: false })
    .threshold(128)
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Paint solid off-white and attach the mask as the alpha channel.
  const masked = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 235, g: 235, b: 245 },
    },
  })
    .joinChannel(mask.data, {
      raw: { width: meta.width, height: meta.height, channels: 1 },
    })
    .png()
    .toBuffer()

  // Second pass: trim transparent margins so the file is tightly cropped.
  await sharp(masked).trim({ threshold: 1 }).png().toFile(output)

  const outMeta = await sharp(output).metadata()
  console.log(`Wrote ${output}  (${outMeta.width}x${outMeta.height})`)

  // Favicon: dark-grey square (#1C1C1E) + off-white letters from the same mask.
  // Keep the full 1024x1024 canvas so the letters sit centered with margin, then
  // downsample to 256x256.
  const lettersOnDark = await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 3,
      background: { r: 28, g: 28, b: 30 },
    },
  })
    .composite([{ input: masked, blend: 'over' }])
    .png()
    .toBuffer()

  await sharp(lettersOnDark).resize(256, 256).png().toFile(faviconOut)
  const favMeta = await sharp(faviconOut).metadata()
  console.log(`Wrote ${faviconOut}  (${favMeta.width}x${favMeta.height})`)

  // Header wordmark (full "Real World News" blackletter) — same mask treatment.
  await processMask(headerInput, headerOutput)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
