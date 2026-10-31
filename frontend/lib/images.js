/** Resolve after every image is decoded. Retain the result to keep images alive. */
export async function preloadImages(urls) {
  const images = urls.map(url => {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    return image
  })
  await Promise.all(images.map(image => image.decode()))
  return images
}
