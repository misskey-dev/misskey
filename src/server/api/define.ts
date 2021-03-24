import * as fs from 'fs';
import { ILocalUser } from '../../models/entities/user';
import { IEndpointMeta } from './endpoints';
import { ApiError } from './error';
import { SchemaType } from '@/misc/schema';
import { AccessToken } from '../../models/entities/access-token';

type SimpleUserInfo = {
	id: ILocalUser['id'];
	host: ILocalUser['host'];
	username: ILocalUser['username'];
	uri: ILocalUser['uri'];
	inbox: ILocalUser['inbox'];
	sharedInbox: ILocalUser['sharedInbox'];
	isAdmin: ILocalUser['isAdmin'];
	isModerator: ILocalUser['isModerator'];
	isSilenced: ILocalUser['isSilenced'];
};

// TODO: defaultが設定されている場合はその型も考慮する
type Params<T extends IEndpointMeta> = {
	[P in keyof T['params']]: NonNullable<T['params']>[P]['transform'] extends Function
		? ReturnType<NonNullable<T['params']>[P]['transform']>
		: ReturnType<NonNullable<T['params']>[P]['validator']['get']>[0];
};

export type Response = Record<string, any> | void;

type executor<T extends IEndpointMeta> =
	(params: Params<T>, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any, cleanup?: Function) =>
		Promise<T['res'] extends undefined ? Response : SchemaType<NonNullable<T['res']>>>;

export default function <T extends IEndpointMeta>(meta: T, cb: executor<T>)
		: (params: any, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any) => Promise<any> {
	return (params: any, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any) => {
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

		return cb(ps, user, token, file, cleanup);
	};
}

function getParams<T extends IEndpointMeta>(defs: T, params: any): [Params<T>, ApiError | null] {
	if (defs.params == null) return [params, null];

	const x: any = {};
	let err: ApiError | null = null;
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
