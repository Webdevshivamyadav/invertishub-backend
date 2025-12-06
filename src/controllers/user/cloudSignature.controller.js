const cloudinary = require('cloudinary').v2
// Ensure your cloudinary config is done once, ideally at server start
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})
const getSignature = (req, res) => {
  const timestamp = Math.round(Date.now() / 1000)

  const params_to_sign = {
    timestamp,
    folder: 'temp_uploads',
    type: 'authenticated'
  }

  const signature = cloudinary.utils.api_sign_request(
    params_to_sign,
    process.env.CLOUDINARY_API_SECRET
  )

  res.json({
    timestamp,
    signature,
    folder: 'temp_uploads',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY
  })
}

const getMediaById = async (id) => {
  if (!id) {
   
    return null
  }

  const ids = Array.isArray(id) ? id : [id]

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60 // 30 min

    const result = await Promise.all(
      ids.map(async (publicId) => {
        const signature = cloudinary.utils.api_sign_request(
          {
            public_id: publicId,
            expires_at: expiresAt,
            type: 'authenticated'
          },
          process.env.CLOUDINARY_API_SECRET
        )

        const signedUrl = cloudinary.url(publicId, {
          type: 'authenticated',
          resource_type: 'image',
          sign_url: true,
          secure: true,
          expires_at: expiresAt,
          signature
        })

        return {
          id: publicId,
          url: signedUrl,
          expiresAt
        }
      })
    )

    // If single id was given → return single object instead of array
    return Array.isArray(id) ? result : result[0]
  } catch (err) {
   
    return null
  }
}

async function moveAssetDynamic(publicId, newFolder) {
  try {
    const result = await cloudinary.api.update(publicId, {
      asset_folder: newFolder, // Set the new folder path
      type: 'authenticated'
      // resource_type: 'image' // Default, use 'video' or 'raw' if needed
    })

    return result
  } catch (error) {
    throw error
  }
}
const finalUploadTheFile = async (publicId, newFolder) => {
  try {
    const oldPublicId = publicId
    const extract = publicId.split('/')
    const fileId = extract[1]
    const newPublicId = `${newFolder}/${fileId}`
    const renamePath = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
      overwrite: true,
      type: 'authenticated',
      resource_type: 'image',
      invalidate: true
    })

    return renamePath
  } catch (error) {
    return error
  }
}
module.exports = {
  getSignature,
  getMediaById,
  finalUploadTheFile,
  moveAssetDynamic
}
