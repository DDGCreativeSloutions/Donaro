const express = require('express');
const path = require('path');
const { upload, processImage, processDonationPhoto } = require('../utils/imageUpload');

const router = express.Router();

// Upload donation photo
router.post('/donation-photo', upload.single('donationPhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the uploaded image
    const processedImagePath = await processDonationPhoto(req.file.path, req.body.userId);
    
    // Return the path to the processed image
    const imagePath = `/uploads/${path.basename(processedImagePath)}`;
    res.json({ imagePath });
  } catch (error) {
    console.error('Error uploading donation photo:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

// Upload selfie photo
router.post('/selfie-photo', upload.single('selfiePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the uploaded image
    const processedImagePath = await processImage(req.file.path);
    
    // Return the path to the processed image
    const imagePath = `/uploads/${path.basename(processedImagePath)}`;
    res.json({ imagePath });
  } catch (error) {
    console.error('Error uploading selfie photo:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

module.exports = router;