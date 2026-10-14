'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadFileToCloudinary(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'zarpit_resumes', resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload_stream error:', error);
            resolve({ success: false, error: 'Upload failed at Cloudinary' });
          } else {
            resolve({ success: true, url: result?.secure_url });
          }
        }
      );
      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}
