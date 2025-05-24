import express, { Application, Request, Response } from 'express';
import * as fs from 'fs';
import { ScreenShotUploaderFactory } from './uploaders/ScreenShotUploaderFactory.js';
import { DiscordScreenShotAutoUploaderInput, ScreenShotUploader } from './uploaders/ScreenShotUploader.js';
import chokidar, { FSWatcher } from 'chokidar';
import { SystemConfig } from './db/pouchdb/SystemConfig.js';

const app: Application = express();
const PORT: number = 3001;

// app.use('/', (req: Request, res: Response): void => {

// });

app.listen(PORT, (): void => {
    console.log('SERVER IS UP ON PORT:', PORT);
});

let uploaders: ScreenShotUploader[] = [];
let mainWatcher;

SystemConfig.initialize();

async function startWatchers() {
    console.log('Starting watchers');
    const factory = new ScreenShotUploaderFactory();
    const configs = loadDusuConfigFile();
    uploaders = [];

    const watchDirs: string[] = [];
    for (const config of configs) {
        const uploader = factory.create(config);
        watchDirs.push(config.watchDir);
        uploaders.push(uploader);
    }

    console.log('watchDirs: ' + watchDirs)
    console.log('uploaders: ', uploaders);

    mainWatcher = chokidar.watch(watchDirs as ReadonlyArray<string>, { ignored: /^\./, persistent: true });

    setTimeout(() => {
        uploaders.forEach(uploader => uploader.startWatch())
    }, 5000
    );


    // console.log('Starting watchers');
    // const factory = new ScreenShotUploaderFactory();
    // const configs = loadDusuConfigFile();
    // for (const config of configs) {
    //     const uploader = factory.create(config);
    //     uploaders.push(uploader);
    //     uploader.startWatch();
    // }
}

async function stopWatchers() {
    console.log('Stoping watchers');
    for (const uploader of uploaders) {
        await uploader.stopWatch();
    }
}

function loadDusuConfigFile(): DiscordScreenShotAutoUploaderInput[] {
    const config = JSON.parse(fs.readFileSync('dusu.config.json').toString());
    return config.watchers.map(item => item as DiscordScreenShotAutoUploaderInput);
}

async function restartWatchers() {
    await stopWatchers();
    await startWatchers();
}

async function init() {
    startWatchers();
    startWatchConfigFile();
}

async function startWatchConfigFile() {
    let configInitialized = false;
    const configFile = './dusu.config.json';
    const watcher = chokidar.watch(configFile, { ignored: /^\./, persistent: true });

    watcher.on('change', async path => setTimeout(async () => {
        if (configInitialized) {
            console.log('Config changed');
            await restartWatchers();
        }
    }, 1000))

    setTimeout(() => {
        configInitialized = true;
        console.log(`Watching config file"${configFile}"`);
    }, 1000);
}

await init();