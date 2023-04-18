const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const app = express();

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files in the public directory
app.use(express.static('public'));

// Render index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Handle image uploads and overlay
app.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    // Check that the uploaded file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'The uploaded file must be an image.' });
    }

    // Read the uploaded image into a buffer
    const buffer = req.file.buffer;

    // Read the overlay image from file
    const overlayBuffer = fs.readFileSync(__dirname + `/public/overlays/${req.body.overlay}` + '.png');

    // Resize the overlay image to match the uploaded image
    const metadata = await sharp(buffer).metadata();
    const overlayResized = await sharp(overlayBuffer).resize(metadata.width, metadata.height).toBuffer();

    // Overlay the images
    const outputBuffer = await sharp(buffer).composite([{ input: overlayResized }]).toBuffer();

    // Send the overlaid image as the response
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': outputBuffer.length,
      'Content-Disposition': `attachment; filename="overlayed_${Date.now()}.png"`

    });
    res.end(outputBuffer);
  } catch (err) {
    next(err);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}.`));
