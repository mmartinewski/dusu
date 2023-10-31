import path from 'path';

import { AbstractDiscordScreenShotAutoUploader } from "./AbstractDiscordScreenShotAutoUploader.js";

export class SteamDiscordUploader extends AbstractDiscordScreenShotAutoUploader {

    getGameId(filePath: string): string {
        try {
            return path.basename(path.dirname(path.dirname(filePath)));
        } catch (error) {
            console.error('Failed to get steam game id', error);
            return null;
        }
    }

    isValidFile(filePath: string): boolean {
        return this.isInScreenShotDir(filePath);
    }

    private isInScreenShotDir(filePath: string) {
        return path.basename(path.dirname(filePath)) == 'screenshots';
    }

}