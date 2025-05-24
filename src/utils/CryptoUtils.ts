import * as crypto from 'crypto';

export class CryptoUtils {

    public static stringMd5Hash(value: string) {
        return crypto.createHash('md5').update(value).digest('hex');
    }

}