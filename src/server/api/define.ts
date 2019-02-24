import * as fs from 'fs';
import { ILocalUser } from '../../models/user';
import { IApp } from '../../models/app';
import { IEndpointMeta } from './endpoints';
import { ApiError } from './error';

type Params<T extends IEndpointMeta> = {
	[P in keyof T['params']]: T['params'][P]['transform'] extends Function
		? ReturnType<T['params'][P]['transform']>
		: ReturnType<T['params'][P]['validator']['get']>[0];
};

export type Response = Record<string, any> | void;

export default function <T extends IEndpointMeta>(meta: T, cb: (params: Params<T>, user: ILocalUser, app: IApp, file?: any, cleanup?: Function) => Promise<Response>): (params: any, user: ILocalUser, app: IApp, file?: any) => Promise<any> {
	return (params: any, user: ILocalUser, app: IApp, file?: any) => {
		function cleanup() {
			fs.unlink(file.path, () => {});
		}

		if (meta.requireFile && file == null) return Promise.reject(new ApiError({
			message: 'File required.',
			code: 'FILE_REQUIRED',
			id: '4267801e-70d1-416a-b011-4ee502885d8b',
		}));

		const [ps, pserr] = getParams(meta, params);
		if (pserr) {
			if (file) cleanup();
			return Promise.reject(pserr);
		}

		return cb(ps, user, app, file, cleanup);
	};
}

function getParams<T extends IEndpointMeta>(defs: T, params: any): [Params<T>, ApiError] {
	if (defs.params == null) return [params, null];

	const x: any = {};
	let err: ApiError = null;
	Object.entries(defs.params).some(([k, def]) => {
		const [v, e] = def.validator.get(params[k]);
		if (e) {
			err = new ApiError({
				message: 'Invalid param.',
				code: 'INVALID_PARAM',
				id: '3d81ceae-475f-4600-b2a8-2bc116157532',
			}, {
				param: k,
				reason: e.message
			});
			return true;
		} else {
			if (v === undefined && def.hasOwnProperty('default')) {
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
