import PouchDB from 'pouchdb';

export class PouchDBConnector {

    private static INSTANCES_BY_NAME: Map<string, PouchDBConnector> = new Map<string, PouchDBConnector>();

    static getInstance(dbName: string): PouchDBConnector {
        let rtn = PouchDBConnector.INSTANCES_BY_NAME.get(dbName);
        if (!rtn) {
            rtn = new PouchDBConnector(dbName);
            PouchDBConnector.INSTANCES_BY_NAME.set(dbName, rtn);
        }
        return rtn;
    }

    public dbName: string;
    private readonly db: PouchDB;


    private constructor(dbName: string) {
        this.dbName = dbName;
        this.db = new PouchDB(this.dbName);
    }

    public async putDocument(document: any): Promise<any> {
        if (!document._id) {
            throw new Error('Id must be provided');
        }
        return await this.db.put(document);
    }

    public async getDocument(key: string): Promise<any> {
        return await this.db.get(key);
    }

    public async exists(key: string): Promise<any> {
        return await this.db.get(key);
    }

}