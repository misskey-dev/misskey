import * as uuid from 'uuid';
import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import config from '../../../../../config';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str
		}
	}
};

export default define(meta, ps => App.findOne({ secret: ps.appSecret })
	.then(x =>
		!x ? error('app not found') :
		AuthSess.insert({
			createdAt: new Date(),
			appId: x._id,
			token: uuid.v4()
		}))
	.then(x => ({
		token: x.token,
		url: `${config.auth_url}/${x.token}`
	})));
