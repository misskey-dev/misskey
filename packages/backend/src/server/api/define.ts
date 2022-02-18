import * as fs from 'fs';
import Ajv from 'ajv';
import { ILocalUser } from '@/models/entities/user';
import { IEndpointMeta } from './endpoints';
import { ApiError } from './error';
import { SchemaType } from '@/misc/schema';
import { AccessToken } from '@/models/entities/access-token';

type SimpleUserInfo = {
	id: ILocalUser['id'];
	createdAt: ILocalUser['createdAt'];
	host: ILocalUser['host'];
	username: ILocalUser['username'];
	uri: ILocalUser['uri'];
	inbox: ILocalUser['inbox'];
	sharedInbox: ILocalUser['sharedInbox'];
	isAdmin: ILocalUser['isAdmin'];
	isModerator: ILocalUser['isModerator'];
	isSilenced: ILocalUser['isSilenced'];
	showTimelineReplies: ILocalUser['showTimelineReplies'];
};

export type Response = Record<string, any> | void;

// TODO: paramsの型をT['params']のスキーマ定義から推論する
type executor<T extends IEndpointMeta> =
	(params: any, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any, cleanup?: () => any) =>
		Promise<T['res'] extends undefined ? Response : SchemaType<NonNullable<T['res']>>>;

const ajv = new Ajv({
	useDefaults: true,
});

ajv.addFormat('misskey:id', /^[a-z0-9]+$/);

export default function <T extends IEndpointMeta>(meta: T, cb: executor<T>)
		: (params: any, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any) => Promise<any> {

	const validate = meta.params ? ajv.compile(meta.params) : null;

	return (params: any, user: T['requireCredential'] extends true ? SimpleUserInfo : SimpleUserInfo | null, token: AccessToken | null, file?: any) => {
		function cleanup() {
			fs.unlink(file.path, () => {});
		}

		if (meta.requireFile && file == null) return Promise.reject(new ApiError({
			message: 'File required.',
			code: 'FILE_REQUIRED',
			id: '4267801e-70d1-416a-b011-4ee502885d8b',
		}));

		if (validate) {
			const valid = validate(params);
			if (!valid) {
				if (file) cleanup();

				const err = new ApiError({
					message: 'Invalid param.',
					code: 'INVALID_PARAM',
					id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				}, /* TODO {
					param: k,
					reason: e.message,
				}*/);
				return Promise.reject(err);
			}
		}

		return cb(params, user, token, file, cleanup);
	};
}
