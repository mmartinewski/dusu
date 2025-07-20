export interface ScreenShotUploader {
    startWatch(): Promise<void>;
    stopWatch(): Promise<void>;
}

export interface DiscordScreenShotAutoUploaderInput {
    type?: string;
    watchDir: string;
    watchDirStartDelay?: number;
    defaultWebhookUrl?: string;
    webhookUrlByGameId?: DiscordWebhookConfig[];
    acceptedExtensions?: string[];
}

export interface DiscordWebhookConfig {
    gameId: string;
    webhookUrl: string;
    disabled?: boolean;
    description?: string;
}