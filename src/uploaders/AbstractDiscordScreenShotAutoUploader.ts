import chokidar, { FSWatcher } from 'chokidar';
import { Webhook as DiscordWebHook } from 'discord-webhook-node';
import path from 'path';
import fs from 'fs';

import { DiscordScreenShotAutoUploaderInput, DiscordWebhookConfig, ScreenShotUploader } from './ScreenShotUploader.js';
import { SystemConfig } from '../db/pouchdb/SystemConfig.js';
import { FileUploadDB } from '../db/pouchdb/FileUploadDB.js';
import { FileUpload } from '../model/FileUpload.js';

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
    private fileUploadDb: FileUploadDB = new FileUploadDB();

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
        }, 1, this.watchDirStartDelay);
        this.watcher
            .on('add', async path => setTimeout(async () => await this.checkFileUpload(path, 3), 1000))
    }

    async stopWatch() {
        if (this.watcher) {
            await this.watcher.close();
            console.log(`Dir ${this.watchDir} watcher closed`);
        }
    }

    private async checkFileUpload(filePath: string, retries = 0) {
        if (!this.isFileExtensionAccepted(filePath)) {
            return;
        }
        if (!fs.existsSync(filePath)) {
            console.log(`Ignoring file '${filePath}'. It no longer exists.`);
            return;
        }
        try {
            if (!this.isWritable(filePath)) {
                throw new Error(`File ${filePath} is locked`);
            }
            if (!this.fileWatcherEnabled) {
                return;
            }
            if (!await this.mustUpload(filePath)) {
                return;
            }
            if (!this.isValidFile(filePath)) {
                return;
            }
            await this.uploadFile(filePath);
        } catch (error) {
            console.log(error);
            console.log(`Failed to upload file "${filePath}"`);
            if (retries > 0) {
                console.log(`Trying again. Retries left ${retries}`);
                setTimeout(() => this.checkFileUpload(filePath, retries - 1), 1000);
            } else {
                console.log('Giving up');
            }
        }
    }

    private async mustUpload(filePath: string): Promise<boolean> {
        return this.isFileDateValid(filePath) && !(await this.isFileAlreadyUploaded(filePath));
    }

    private isFileDateValid(filePath: string) {
        const systemConfig = SystemConfig.getConfig();
        const fileLastModified = this.getFileLastModified(filePath);
        return fileLastModified.getTime() > systemConfig.uploadsStartDate.getTime();
    }

    private async isFileAlreadyUploaded(filePath: string): Promise<boolean> {
        let fileUpload: FileUpload;
        try {
            fileUpload = await this.fileUploadDb.findByFilePath(filePath);
        } catch(ex) {
            if (ex.status !== 404) {
                throw ex;
            }
        }
        return fileUpload && fileUpload.uploaded;
    }

    private getFileLastModified(filePath: string): Date {
        const stats = fs.statSync(filePath);
        return new Date(stats.mtime);
    }

    private isWritable(filePath: string) {
        let fileAccess = false
        try {
            fs.closeSync(fs.openSync(filePath, 'r+'))
            fileAccess = true
        } catch (err) {
            console.log('can not open file!')
        }
        return fileAccess;
    }

    private isFileExtensionAccepted(filePath: string) {
        return this.acceptedExtensions.includes((path.extname(filePath) || '').toLowerCase());
    }

    private async uploadFile(filePath: string) {
        const hookUrl = this.getFileWebhookUrl(filePath);
        if (hookUrl) {
            const hook = new DiscordWebHook(hookUrl);
            await hook.sendFile(filePath);
            await this.fileUploadDb.save({
                filePath: filePath,
                uploaded: true,
                fileModifiedAt: this.getFileLastModified(filePath),
                uploadedAt: new Date(),
            });
            console.log(`File '${filePath}' uploaded sucessfully at ${new Date().toISOString()}`);
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