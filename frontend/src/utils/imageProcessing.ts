/**
 * Adds an Indian flag overlay to the bottom right corner of an image
 * @param imageUrl The URL of the image to process
 * @returns A promise that resolves to a Blob of the processed image
 */
export async function addIndianFlagOverlay(imageUrl: string): Promise<Blob> {
  try {
    // Load the main image and the flag
    const [imageBlob, flagBlob] = await Promise.all([
      fetch(imageUrl).then((res) => res.blob()),
      createIndianFlag(80, 45),
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
    ctx.drawImage(
      flagImage,
      canvas.width - flagImage.width - marginRight,
      canvas.height - flagImage.height - marginBottom
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
 * Creates an Indian flag image
 * @param width The width of the flag
 * @param height The height of the flag
 * @returns A blob containing the flag image
 */
function createIndianFlag(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Draw the three horizontal stripes
  const stripeHeight = height / 3

  // Orange (saffron) stripe
  ctx.fillStyle = '#FF9933'
  ctx.fillRect(0, 0, width, stripeHeight)

  // White stripe
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, stripeHeight, width, stripeHeight)

  // Green stripe
  ctx.fillStyle = '#138808'
  ctx.fillRect(0, stripeHeight * 2, width, stripeHeight)

  // Draw the Ashoka Chakra (simplified as a blue circle with 24 spokes)
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 8

  // Draw blue circle
  ctx.fillStyle = '#000080'
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Draw 24 spokes
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1

  for (let i = 0; i < 24; i++) {
    const angle = (i * 15 * Math.PI) / 180 // 24 spokes at 15 degrees apart
    const x1 = centerX + radius * 0.7 * Math.cos(angle)
    const y1 = centerY + radius * 0.7 * Math.sin(angle)
    const x2 = centerX + radius * Math.cos(angle)
    const y2 = centerY + radius * Math.sin(angle)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })
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
    // This is a mock implementation for demo purposes
    // In a real app, you'd need to use Twitter API
    // Due to CORS and authentication requirements, this would typically be done through a backend

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Return a placeholder image for the demo
    // In real implementation, you'd fetch the actual profile image from Twitter API
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username
    )}&background=random`
  } catch (error) {
    console.error('Error fetching Twitter profile:', error)
    return null
  }
}
