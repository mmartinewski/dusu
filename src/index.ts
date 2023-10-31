import express, { Application, Request, Response } from 'express';
import * as fs from 'fs';
import { ScreenShotUploaderFactory } from './uploaders/ScreenShotUploaderFactory.js';
import { DiscordScreenShotAutoUploaderInput } from './uploaders/ScreenShotUploader.js';

const app: Application = express();
const PORT: number = 3001;

// app.use('/', (req: Request, res: Response): void => {

// });

app.listen(PORT, (): void => {
    console.log('SERVER IS UP ON PORT:', PORT);
});

function startWatchers() {
    const factory = new ScreenShotUploaderFactory();
    const configs = loadDusuConfigFile();
    configs.forEach(config => {
        const uploader = factory.create(config);
        uploader.startWatch();
    })
}

function loadDusuConfigFile(): DiscordScreenShotAutoUploaderInput[] {
    const config = JSON.parse(fs.readFileSync('dusu.config.json').toString());
    return config.watchers.map(item => item as DiscordScreenShotAutoUploaderInput);
}

startWatchers();