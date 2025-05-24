export interface FileUpload {
    _id?: string;
    filePath: string;
    uploaded: boolean;
    fileModifiedAt?: Date;
    uploadedAt?: Date;
}