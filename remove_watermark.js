const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const inputPath = 'public/intro.mp4';
const outputPath = 'public/intro_clean.mp4';

console.log('Using ffmpeg at:', ffmpegPath);

try {
  // crop=iw:ih*0.9:0:0 crops 10% off the bottom.
  // We can also try iw*0.95:ih*0.9:0:0 to crop a bit from the right too.
  execSync(`"${ffmpegPath}" -y -i "${inputPath}" -filter:v "crop=iw:ih*0.9:0:0" -c:a copy "${outputPath}"`, { stdio: 'inherit' });
  console.log('Watermark removed successfully!');
  
  // Replace original
  fs.renameSync(outputPath, inputPath);
  console.log('Original video replaced with clean video.');
} catch (error) {
  console.error('Error removing watermark:', error.message);
}
