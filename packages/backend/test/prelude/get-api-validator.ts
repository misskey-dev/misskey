import { Schema } from '@/misc/schema';
import Ajv from 'ajv';

export const getValidator = (paramDef: Schema) => {
    const ajv = new Ajv({
        useDefaults: true,
    });
    ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);		

    return ajv.compile(paramDef);
}
