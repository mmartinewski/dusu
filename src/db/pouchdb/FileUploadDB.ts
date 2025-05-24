import { FileUpload } from "../../model/FileUpload.js";
import { CryptoUtils } from "../../utils/CryptoUtils.js";
import { PouchDBConnector } from "./PouchDBConnector.js"

export class FileUploadDB {


    private static FILE_UPLOAD_DB = 'file_upload_db';
    private readonly dbConnector: PouchDBConnector = PouchDBConnector.getInstance(FileUploadDB.FILE_UPLOAD_DB);

    constructor() { 

    }

    public async findById(id: string): Promise<FileUpload> {
        return this.dbConnector.getDocument(id);
    }

    public async findByFilePath(filePath: string): Promise<FileUpload> {
        return await this.findById(CryptoUtils.stringMd5Hash(filePath));
    }

    public async save(fileUpload: FileUpload): Promise<void> {
        return await this.put(fileUpload);
    }

    public async update(fileUpload: FileUpload): Promise<void> {
        return await this.put(fileUpload);
    }

    private async put(fileUpload: FileUpload): Promise<void> {
        fileUpload._id = CryptoUtils.stringMd5Hash(fileUpload.filePath);
        return await this.dbConnector.putDocument(fileUpload);
    }

}