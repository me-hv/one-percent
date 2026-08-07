/**
 * Client-Side Image Compression & Processing Utilities.
 * Uses HTML5 Canvas to downscale and compress progress photo uploads
 * into optimized JPEG Data URLs (<500KB) before saving to local storage / Firebase.
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

/**
 * Compresses an image File or Data URL using HTML5 Canvas.
 * Returns a compressed base64 JPEG data URL.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 1600, quality = 0.75 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()

    const loadImage = (src: string) => {
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect-ratio bounds
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get 2D canvas context"))
          return
        }

        // Draw image into canvas with smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
        ctx.drawImage(img, 0, 0, width, height)

        // Export as JPEG with configured quality
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }
      img.onerror = (err) => reject(err)
      img.src = src
    }

    if (typeof fileOrDataUrl === "string") {
      loadImage(fileOrDataUrl)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          loadImage(e.target.result as string)
        } else {
          reject(new Error("Failed to read image file"))
        }
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}
