import sharp from 'sharp';
import path from 'path';

// Use string file paths, not imports
const inputPath = path.resolve('./User/assets/pic1.jpg');
const outputPath = path.resolve('./User/assets/pic2.jpg');

async function optimizeImage(input, output) {
  try {
    await sharp(input)
      .resize({ width: 500 })
      .png({ quality: 100 })  
      .toFile(output);

    console.log('✅ Image optimized and saved to', output);
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
  }
}

optimizeImage(inputPath, outputPath);
