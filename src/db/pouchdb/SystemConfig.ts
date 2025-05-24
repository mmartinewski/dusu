import * as fs from 'fs';

export interface SystemConfigData {
    readonly initializedAt: Date;
    readonly uploadsStartDate: Date;
}

export class SystemConfig {

    private static readonly configFilePath = 'dusu.system.config.json';
    private static readonly config: SystemConfigData = SystemConfig.readSystemConfigFile();

    private constructor() {
        SystemConfig.readSystemConfigFile();
    }

    public static getConfig(): SystemConfigData {
        return SystemConfig.config;
    }

    public static initialize(): SystemConfigData {
        return SystemConfig.readSystemConfigFile();
    }

    private static readSystemConfigFile(): SystemConfigData {
        SystemConfig.createSystemConfigFile();
        const jsonData = JSON.parse(fs.readFileSync(SystemConfig.configFilePath).toString());
        return {
            initializedAt: new Date(jsonData.initializedAt),
            uploadsStartDate: new Date(jsonData.uploadsStartDate),
        };
    }

    private static createSystemConfigFile() {
        if (!fs.existsSync(SystemConfig.configFilePath)) {
            console.log('System config file created');
            const now = new Date();
            const dbConfigData: SystemConfigData = {
                initializedAt: now,
                uploadsStartDate: now,
            };
            fs.writeFileSync(SystemConfig.configFilePath, JSON.stringify(dbConfigData));
        }
    }

}


