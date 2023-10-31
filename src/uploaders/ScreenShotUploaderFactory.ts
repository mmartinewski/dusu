import { ScreenShotUploader } from "./ScreenShotUploader.js";
import { SteamDiscordUploader } from "./SteamDiscordUploader.js";
import { XBoxDiscordUploader } from "./XBoxDiscordUploader.js";

export class ScreenShotUploaderFactory {

    create(config: any): ScreenShotUploader {
        const { type } = config;
        switch (type) {
            case 'steam': return new SteamDiscordUploader(config);
            case 'xbox': return new XBoxDiscordUploader(config);
        }
        throw new Error(`Type "${type}" not supported`);
    }

}