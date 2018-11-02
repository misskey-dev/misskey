import * as fs from 'fs';
import { ILocalUser } from '../../models/user';
import { IApp } from '../../models/app';
import { IEndpointMeta } from './endpoints';

type Params<T extends IEndpointMeta> = {
	[P in keyof T['params']]: T['params'][P]['transform'] extends Function
		? ReturnType<T['params'][P]['transform']>
		: ReturnType<T['params'][P]['validator']['get']>[0];
};

export default function <T extends IEndpointMeta>(meta: T, cb: (params: Params<T>, user: ILocalUser, app: IApp, file?: any, cleanup?: Function) => Promise<any>): (params: any, user: ILocalUser, app: IApp, file?: any) => Promise<any> {
	return (params: any, user: ILocalUser, app: IApp, file?: any) => {
		function cleanup() {
			fs.unlink(file.path, () => {});
		}

		if (meta.requireFile && file == null) return Promise.reject('file required');

		const [ps, pserr] = getParams(meta, params);
		if (pserr) {
			if (file) cleanup();
			return Promise.reject(pserr);
		}

		return cb(ps, user, app, file, cleanup);
	};
}

function getParams<T extends IEndpointMeta>(defs: T, params: any): [Params<T>, Error] {
	const x: any = {};
	let err: Error = null;
	Object.entries(defs.params).some(([k, def]) => {
		const [v, e] = def.validator.get(params[k]);
		if (e) {
			err = new Error(e.message);
			err.name = 'INVALID_PARAM';
			(err as any).param = k;
			return true;
		} else {
			if (v === undefined && def.default) {
				x[k] = def.default;
			} else {
				x[k] = v;
			}
			if (def.transform) x[k] = def.transform(x[k]);
			return false;
		}
	});
	return [x, err];
}
