const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads with security improvements
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Resolve and validate the upload directory
    const uploadDir = path.resolve('uploads/');
    
    // Ensure upload directory exists
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => {
      cb(new Error('Failed to create upload directory'));
    });
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Sanitize filename to prevent path traversal
    const originalName = path.basename(file.originalname);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    
    // Allow only alphanumeric characters, hyphens, and underscores in filename
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    
    cb(null, `${sanitizedName}-${uniqueSuffix}${sanitizedExt}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Process and optimize uploaded image
async function processImage(filePath) {
  try {
    // Resolve and validate file path to prevent path traversal
    const resolvedPath = path.resolve(filePath);
    const uploadDir = path.resolve('uploads/');
    
    if (!resolvedPath.startsWith(uploadDir)) {
      throw new Error('Invalid file path');
    }
    
    // Generate output path
    const outputDir = path.dirname(resolvedPath);
    const fileName = path.basename(resolvedPath, path.extname(resolvedPath));
    const outputPath = path.join(outputDir, `${fileName}-optimized.jpg`);
    
    // Ensure output path is also within uploads directory
    const resolvedOutputPath = path.resolve(outputPath);
    if (!resolvedOutputPath.startsWith(uploadDir)) {
      throw new Error('Invalid output path');
    }
    
    // Resize and compress image
    await sharp(resolvedPath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(resolvedOutputPath);
    
    // Remove original file
    await fs.unlink(resolvedPath);
    
    // Return the optimized image path
    return resolvedOutputPath;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Process and optimize donation photo with watermark
async function processDonationPhoto(filePath, userId) {
  try {
    // Resolve and validate file path to prevent path traversal
    const resolvedPath = path.resolve(filePath);
    const uploadDir = path.resolve('uploads/');
    
    if (!resolvedPath.startsWith(uploadDir)) {
      throw new Error('Invalid file path');
    }
    
    // Generate output path
    const outputDir = path.dirname(resolvedPath);
    const fileName = path.basename(resolvedPath, path.extname(resolvedPath));
    const outputPath = path.join(outputDir, `${fileName}-watermarked.jpg`);
    
    // Ensure output path is also within uploads directory
    const resolvedOutputPath = path.resolve(outputPath);
    if (!resolvedOutputPath.startsWith(uploadDir)) {
      throw new Error('Invalid output path');
    }
    
    // Get image metadata
    const metadata = await sharp(resolvedPath).metadata();
    
    // Create watermark text
    const watermarkText = `Donation by User: ${userId} | ${new Date().toLocaleString()}`;
    
    // Add watermark and resize
    await sharp(resolvedPath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .composite([{
        input: {
          text: {
            text: watermarkText,
            font: 'Arial',
            fontfile: null,
            width: Math.min(metadata.width, 800) - 20,
            height: 50,
            rgba: true,
            dpi: 300
          }
        },
        top: Math.min(metadata.height, 800) - 60,
        left: 10,
      }])
      .toFile(resolvedOutputPath);
    
    // Remove original file
    await fs.unlink(resolvedPath);
    
    // Return the watermarked image path
    return resolvedOutputPath;
  } catch (error) {
    console.error('Error processing donation photo:', error);
    throw error;
  }
}

module.exports = {
  upload,
  processImage,
  processDonationPhoto
};