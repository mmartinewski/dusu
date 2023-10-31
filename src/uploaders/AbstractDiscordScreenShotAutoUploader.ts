import chokidar, { FSWatcher } from 'chokidar';
import { Webhook as DiscordWebHook } from 'discord-webhook-node';
import path from 'path';
import { DiscordScreenShotAutoUploaderInput, DiscordWebhookConfig, ScreenShotUploader } from './ScreenShotUploader.js';

const DEFAULT_FILE_WATCHER_START_DELAY = 5000;

const DEFAULT_ACCEPTED_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
];

export abstract class AbstractDiscordScreenShotAutoUploader implements ScreenShotUploader {
    private input: DiscordScreenShotAutoUploaderInput;
    private watchDir: string;
    private defaultWebhookUrl: string;
    private webhookUrlByGameId: DiscordWebhookConfig[];
    private watchDirStartDelay: number;
    private fileWatcherEnabled = false;
    private acceptedExtensions: string[];
    private watcher: FSWatcher;

    constructor(input: DiscordScreenShotAutoUploaderInput) {
        if (!input) {
            throw new Error('Invalid input data');
        }
        this.input = input;
        this.watchDir = input.watchDir;
        this.defaultWebhookUrl = input.defaultWebhookUrl;
        this.webhookUrlByGameId = input.webhookUrlByGameId || [];
        this.watchDirStartDelay = input.watchDirStartDelay || DEFAULT_FILE_WATCHER_START_DELAY;
        this.acceptedExtensions = input.acceptedExtensions || DEFAULT_ACCEPTED_EXTENSIONS;
    }

    abstract isValidFile(filePath: string): boolean;

    abstract getGameId(filePath: string): string;

    async startWatch() {
        await this.stopWatch();
        this.watcher = chokidar.watch(this.watchDir, { ignored: /^\./, persistent: true });

        setTimeout(() => {
            this.fileWatcherEnabled = true;
            console.log(`Watching dir "${this.watchDir}"`);
        }, this.watchDirStartDelay);
        this.watcher
            .on('add', async path => setTimeout(async () => await this.checkFileUpload(path), 1000))
    }

    async stopWatch() {
        if (this.watcher) {
            await this.watcher.close();
            console.log(`Dir ${this.watchDir} watcher closed`);
        }
    }

    private async checkFileUpload(filePath: string) {
        try {
            if (!this.fileWatcherEnabled) {
                return;
            }
            if (this.isFileExtensionAccepted(filePath) && this.isValidFile(filePath)) {
                await this.uploadFile(filePath);
                console.log('File uploaded - ' + filePath);
            }
        } catch (error) {
            console.log(error);
            console.log(`Failed to upload file "${filePath}"`);
        }
    }

    private isFileExtensionAccepted(filePath: string) {
        return this.acceptedExtensions.includes((path.extname(filePath) || '').toLowerCase());
    }

    private async uploadFile(filePath: string) {
        const hookUrl = this.getFileWebhookUrl(filePath);
        if (hookUrl) {
            const hook = new DiscordWebHook(hookUrl);
            await hook.sendFile(filePath);
        } else {
            console.error('Hook url not found for file "' + filePath + '"');
        }
    }

    private getFileWebhookUrl(filePath: string) {
        const gameId = this.getGameId(filePath);
        const urlConfig = this.webhookUrlByGameId.find(item => item.gameId == gameId);
        return urlConfig?.webhookUrl || this.defaultWebhookUrl;
    }

}