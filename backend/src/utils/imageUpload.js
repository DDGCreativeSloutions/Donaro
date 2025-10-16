const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
    // Generate output path
    const outputDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(outputDir, `${fileName}-optimized.jpg`);
    
    // Resize and compress image
    await sharp(filePath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    // Remove original file
    await fs.unlink(filePath);
    
    // Return the optimized image path
    return outputPath;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

// Process and optimize donation photo with watermark
async function processDonationPhoto(filePath, userId) {
  try {
    // Generate output path
    const outputDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(outputDir, `${fileName}-watermarked.jpg`);
    
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    
    // Create watermark text
    const watermarkText = `Donation by User: ${userId} | ${new Date().toLocaleString()}`;
    
    // Add watermark and resize
    await sharp(filePath)
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
      .toFile(outputPath);
    
    // Remove original file
    await fs.unlink(filePath);
    
    // Return the watermarked image path
    return outputPath;
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