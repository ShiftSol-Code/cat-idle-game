import { Jimp } from 'jimp';
import path from 'path';

const images = [
    'public/cat_neutral.png',
    'public/cat_sleep.png'
];

async function processImages() {
    for (const imgPath of images) {
        try {
            const image = await Jimp.read(imgPath);
            const targetColor = { r: 0, g: 255, b: 0 }; // Green
            const threshold = 80; // Tolerance for green

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                const r = this.bitmap.data[idx + 0];
                const g = this.bitmap.data[idx + 1];
                const b = this.bitmap.data[idx + 2];

                // Check if pixel is green-ish
                // High Green, Low Red/Blue
                if (g > 255 - threshold && r < threshold + 100 && b < threshold + 100) {
                    this.bitmap.data[idx + 3] = 0; // Set alpha to 0
                }
            });

            await image.write(imgPath);
            console.log(`Processed ${imgPath}`);
        } catch (err) {
            console.error(`Error processing ${imgPath}:`, err);
        }
    }
}

processImages();
