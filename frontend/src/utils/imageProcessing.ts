/**
 * Creates an image element from a blob
 * @param blob The blob to create an image from
 * @returns A promise that resolves to an HTMLImageElement
 */
function createImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Adds an Indian flag overlay to the bottom right corner of an image (Normal Mode)
 * @param imageUrl The URL of the image to process
 * @returns A promise that resolves to a Blob of the processed image
 */
export async function addIndianFlagOverlay(imageUrl: string): Promise<Blob> {
  try {
    // Load the main image and the flag from public folder
    const [imageBlob, flagBlob] = await Promise.all([
      fetch(imageUrl).then((res) => res.blob()),
      // Use the SVG file from public folder instead of creating one
      fetch('/india.svg').then((res) => res.blob()),
    ])

    // Create Image elements from blobs
    const mainImage = await createImageFromBlob(imageBlob)
    const flagImage = await createImageFromBlob(flagBlob)

    // Create a canvas for compositing
    const canvas = document.createElement('canvas')
    canvas.width = mainImage.width
    canvas.height = mainImage.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0)

    // Draw the flag in the bottom right corner with a small margin
    const marginRight = 20
    const marginBottom = 20
    const flagWidth = 160
    const flagHeight = 80
    
    ctx.drawImage(
      flagImage,
      canvas.width - flagWidth - marginRight,
      canvas.height - flagHeight - marginBottom,
      flagWidth,
      flagHeight
    )

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/jpeg',
        0.9
      )
    })
  } catch (error) {
    console.error('Error adding flag overlay:', error)
    throw error
  }
}

/**
 * Adds an Indian flag overlay and stamp to the image (Normal Mode)
 * @param imageUrl The URL of the image to process
 * @returns A promise that resolves to a Blob of the processed image
 */
export async function normalModeProcessing(imageUrl: string): Promise<Blob> {
  try {
    // Load the main image, flag, and stamp from public folder
    const [imageBlob, flagBlob] = await Promise.all([
      fetch(imageUrl).then((res) => res.blob()),
      fetch('/india.svg').then((res) => res.blob()),
    ])

    // Create Image elements from blobs
    const mainImage = await createImageFromBlob(imageBlob)
    const flagImage = await createImageFromBlob(flagBlob)

    // Create a canvas for compositing
    const canvas = document.createElement('canvas')
    canvas.width = mainImage.width
    canvas.height = mainImage.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0)
    
    // Add gradient overlay with Indian flag colors (saffron, white, green)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, 'rgba(255, 153, 51, 0.15)') // Saffron with low opacity
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)') // White with low opacity
    gradient.addColorStop(1, 'rgba(19, 136, 8, 0.15)') // Green with low opacity
    
    // Apply the gradient overlay
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Determine flag size based on image dimensions
    // If image is larger than 1000px in either dimension, increase flag size
    const isLargeImage = (canvas.width > 1000 || canvas.height > 1000)
    
    // Set flag dimensions based on image size
    const marginRight = 20
    const marginBottom = 20
    let flagWidth, flagHeight
    
    if (isLargeImage) {
      // Larger flag for large images
      flagWidth = Math.min(canvas.width * 0.3, 300) // 30% of width, max 300px
      flagHeight = flagWidth * 0.6 // Maintain aspect ratio
    } else {
      // Default size for smaller images
      flagWidth = 100
      flagHeight = 80
    }
    
    // Draw the flag in the bottom right corner with a small margin
    ctx.drawImage(
      flagImage,
      canvas.width - flagWidth - marginRight,
      canvas.height - flagHeight - marginBottom,
      flagWidth,
      flagHeight
    )
    
    // Add a subtle border to the flag for better visibility if needed
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      canvas.width - flagWidth - marginRight,
      canvas.height - flagHeight - marginBottom,
      flagWidth,
      flagHeight
    )

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/jpeg',
        0.9
      )
    })
  } catch (error) {
    console.error('Error in normal mode processing:', error)
    throw error
  }
}


/**
 * Processes an image in "Savage Mode" with elements on bottom left, bottom right and text at the top
 * @param imageUrl The URL of the image to process
 * @returns A promise that resolves to a Blob of the processed image
 */
export async function savageModeProcessing(imageUrl: string): Promise<Blob> {
  try {
    // Load the main image and the overlay images from public folder
    const [imageBlob, leftImageBlob, rightImageBlob] = await Promise.all([
      fetch(imageUrl).then((res) => res.blob()),
      fetch('/modi.svg').then((res) => res.blob()),
      fetch('/virat.svg').then((res) => res.blob()),
    ])

    // Create Image elements from blobs
    const mainImage = await createImageFromBlob(imageBlob)
    const leftImage = await createImageFromBlob(leftImageBlob)
    const rightImage = await createImageFromBlob(rightImageBlob)

    // Create a canvas for compositing
    const canvas = document.createElement('canvas')
    canvas.width = mainImage.width
    canvas.height = mainImage.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0)

    // Determine if image is large (>1000px in any dimension)
    const isLargeImage = (canvas.width > 1000 || canvas.height > 1000)
    
    // Calculate dimensions for Modi and Virat images based on image size
    let modiWidth, modiHeight, viratWidth, viratHeight
    
    if (isLargeImage) {
      // Larger images get larger overlays
      modiWidth = Math.min(canvas.width * 0.35, 1450) 
      modiHeight = Math.min(canvas.height * 0.6, 1600)
      
      viratWidth = Math.min(canvas.width * 0.35, 1450)
      viratHeight = Math.min(canvas.height * 0.6, 1600)
    } else {
      // Default size for smaller images
      modiWidth = Math.min(canvas.width * 0.35, 300)
      modiHeight = Math.min(canvas.height * 0.5, 350)
      
      viratWidth = Math.min(canvas.width * 0.35, 300)
      viratHeight = Math.min(canvas.height * 0.5, 350)
    }
    
    // Add margin above Modi by positioning him lower (closer to bottom)
    const marginAboveModi = Math.floor(canvas.height * 0.1) // 10% margin above Modi
    
    // Position Modi image at the bottom-left corner with margin above
    ctx.drawImage(
      leftImage,
      0, // Start from the left edge
      canvas.height - modiHeight + marginAboveModi, // Bottom-aligned with margin above
      modiWidth,
      modiHeight - marginAboveModi // Adjust height to maintain proportions
    )
    
    // Position Virat image at the bottom-right edge
    ctx.drawImage(
      rightImage,
      canvas.width - viratWidth, // Right-aligned
      canvas.height - viratHeight, // Bottom-aligned
      viratWidth,
      viratHeight
    )
    
    // Add text at the top center
    const text = "Pakistan ke Teen BAAP"
    
    // Set up text style with more impact
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 3 // Thicker outline for better visibility
    
    // Adjust font size based on canvas width and the large image flag
    const fontSize = isLargeImage 
      ? Math.max(Math.min(canvas.width * 0.07, 64), 132) // Larger font for large images
      : Math.max(Math.min(canvas.width * 0.06, 48), 24) // Default font size
      
    ctx.font = `bold ${fontSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    
    // Create text with outline for better visibility
    const textY = canvas.height * 0.05 // Position at 5% from the top
    
    // Add a semi-transparent background behind the text for better readability
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize * 1.2
    const textBgPadding = isLargeImage ? 15 : 10 // Larger padding for large images
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(
      (canvas.width - textWidth) / 2 - textBgPadding,
      textY - textBgPadding,
      textWidth + textBgPadding * 2,
      textHeight + textBgPadding * 2
    )
    
    // Draw the text
    ctx.fillStyle = 'white'
    ctx.strokeText(text, canvas.width / 2, textY)
    ctx.fillText(text, canvas.width / 2, textY)

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to blob'))
          }
        },
        'image/jpeg',
        0.9
      )
    })
  } catch (error) {
    console.error('Error in savage mode processing:', error)
    throw error
  }
}


/**
 * Fetch Twitter profile image by username
 * @param username Twitter username
 * @returns A promise that resolves to the profile image URL or null if not found
 */
export async function fetchTwitterProfileImage(
  username: string
): Promise<string | null> {
  try {
    // For development, we're using a fallback approach since Twitter API requires backend implementation
    // Attempt multiple public services that provide Twitter profile images
    
    try {
      // Try unavatar.io first
      const unavatarUrl = `https://unavatar.io/twitter/${encodeURIComponent(username)}`
      const response = await fetch(unavatarUrl, { method: 'HEAD' })
      
      if (response.ok) {
        return unavatarUrl
      }
    } catch (e) {
      console.log('Primary avatar service unavailable, trying fallback')
    }
    
    // If the first service fails, try an alternative
    return `https://avatars.githubusercontent.com/${encodeURIComponent(username)}`
  } catch (error) {
    console.error('Error fetching Twitter profile:', error)
    
    // Final fallback to using a placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
  }
}

/**
 * Process an image based on the selected mode
 * @param imageUrl The URL of the image to process
 * @param mode The processing mode: 'normal' or 'savage'
 * @returns A promise that resolves to a Blob of the processed image
 */
export async function processImage(
  imageUrl: string, 
  mode: 'normal' | 'savage'
): Promise<Blob> {
  if (mode === 'normal') {
    return normalModeProcessing(imageUrl)
  } else {
    return savageModeProcessing(imageUrl)
  }
}
