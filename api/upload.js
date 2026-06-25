import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';

// Ensure cloudinary is configured. In Vercel, these must be added to Environment Variables.
// Locally, they should be in .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const config = {
  api: {
    bodyParser: false, // Disallow Next.js/Vercel default body parser so formidable can process the stream
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });
  
  try {
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const fileKey = Object.keys(files)[0];
    if (!fileKey) {
       return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileArray = Array.isArray(files[fileKey]) ? files[fileKey] : [files[fileKey]];
    const file = fileArray[0];
    
    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'Invalid file data received' });
    }

    // Upload the file path directly to Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'tezhhomayaa_buyer_app',
    });

    return res.status(200).json({ secure_url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Upload to Cloudinary failed', details: error.message });
  }
}
