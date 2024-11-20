const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const THUMB_WIDTH = 100;
const THUMB_SUFFIX = '_thumb';
const SAMPLE_WIDTH = 500;
const SAMPLE_HEIGHT = 500;

async function createSampleImage(imgPath, text) {
    const image = await new Jimp(SAMPLE_WIDTH, SAMPLE_HEIGHT, 0xCCCCCCFF);
    
    try {
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        image.print(
            font,
            0,
            SAMPLE_HEIGHT / 2 - 16,
            {
                text: text,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            SAMPLE_WIDTH
        );
        
        const dir = path.dirname(imgPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        await image.writeAsync(imgPath);
        return image;
    } catch (error) {
        console.error(`Error creating sample image for ${text}:`, error);
        throw error;
    }
}

async function generateThumbnails() {
    const dataPath = 'data.json';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const thumbsDir = path.join('imgs', 'thumbnails');
    if (!fs.existsSync(thumbsDir)) {
        fs.mkdirSync(thumbsDir, { recursive: true });
    }

    const stats = {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
    };

    for (const node of data.nodes) {
        try {
            if (!node.img && !shouldHaveImage(node)) {
                continue;
            }

            if (!node.img) {
                const defaultPath = path.join('imgs', `${node.id}.jpg`);
                node.img = defaultPath.replace(/\\/g, '/');
            }

            if (!fs.existsSync(node.img)) {
                console.log(`Creating sample image for: ${node.id}`);
                await createSampleImage(node.img, node.name || node.id);
                stats.created++;
            }

            if (node.thmb && fs.existsSync(node.thmb)) {
                stats.skipped++;
                continue;
            }

            const ext = path.extname(node.img);
            const baseName = path.basename(node.img, ext);
            const thumbName = `${baseName}${THUMB_SUFFIX}${ext}`;
            const thumbPath = path.join(thumbsDir, thumbName);

            const image = await Jimp.read(node.img);
            await image
                .scaleToFit(THUMB_WIDTH, Jimp.AUTO)
                .writeAsync(thumbPath);

            node.thmb = thumbPath.replace(/\\/g, '/');
            stats.processed++;

            console.log(`Generated thumbnail: ${thumbPath}`);

        } catch (error) {
            console.error(`Error processing ${node.id}:`, error);
            stats.errors++;
        }
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(`${dataPath}.backup`, JSON.stringify(data, null, 2));

    return stats;
}

function shouldHaveImage(node) {
    const noImageTypes = ['link', 'category', 'concept'];
    return !noImageTypes.includes(node.type);
}

generateThumbnails()
    .then(stats => {
        console.log('\nProcess complete!');
        console.log(`Sample images created: ${stats.created}`);
        console.log(`Thumbnails processed: ${stats.processed}`);
        console.log(`Skipped (already exist): ${stats.skipped}`);
        console.log(`Errors: ${stats.errors}`);
        console.log('\ndata.json has been updated');
        console.log('Backup created: data.json.backup');
    })
    .catch(error => {
        console.error('Script failed:', error);
    }); 