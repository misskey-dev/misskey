import Dexie from 'dexie';

export class MkIdb extends Dexie {
    public i18nContexts: Dexie.Table<I18nContext, string>; // id is number in this case

    public constructor() {
        super("MkIdb");
        this.version(1).stores({
            i18nContexts: "&context"
        });
        this.i18nContexts = this.table("i18nContexts");
    }
}

export const clientDb = new MkIdb();

interface I18nContext {
    context: string,
    translation: string
}
