import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFolderIfNotExists(folderPath) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
}

function createAccessLogStream(logsFolderPath) {
    const accessLogFilePath = path.join(logsFolderPath, 'access.log');
    return fs.createWriteStream(accessLogFilePath, { flags: 'a' });
}

const imageGenerationFolder = path.join(__dirname, 'image-generation');
createFolderIfNotExists(imageGenerationFolder);

const logsFolderPath = path.join(__dirname, 'logs');
createFolderIfNotExists(logsFolderPath);

const accessLogStream = createAccessLogStream(logsFolderPath);

export { accessLogStream };
