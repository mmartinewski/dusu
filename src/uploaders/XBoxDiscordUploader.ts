import { AbstractDiscordScreenShotAutoUploader } from "./AbstractDiscordScreenShotAutoUploader.js";
import path from 'path';

export class XBoxDiscordUploader extends AbstractDiscordScreenShotAutoUploader {
    isValidFile(filePath: string): boolean {
        return true;
    }
    getGameId(filePath: string): string {
        console.log('getGameId => filePath: ', filePath);
        const fileName = path.basename(filePath);
        const id = fileName.replace(/\d{2}_\d{2}_\d{4} \d{1,2}_\d{1,2}_\d{1,2} ((AM)|(PM))\.\w+$/igm,'').trim();
        return id;
    }
}