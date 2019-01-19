import $ from 'cafy';
import App from '../../../../../models/app';
import AuthSess from '../../../../../models/auth-session';
import AccessToken from '../../../../../models/access-token';
import { pack } from '../../../../../models/user';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: false,

	params: {
		appSecret: {
			validator: $.str
		},

		token: {
			validator: $.str
		}
	}
};

export default define(meta, ps => App.findOne({ secret: ps.appSecret })
	.then(x =>
		!x ? error('app not found') :
		AuthSess.findOne({
			token: ps.token,
			appId: x._id
		}))
	.then(x =>
		x === null ? error('session not found') :
		x.userId == null ? error('this session is not allowed yet') :
		AccessToken.findOne({
			appId: x.appId,
			userId: x.userId
		}))
	.then(async x => (
		AuthSess.remove({ _id: x._id }),
		/* https://github.com/Automattic/monk/issues/178
		AuthSess.deleteOne({ _id: session._id }),
		*/
		({
			accessToken: x.token,
			user: await pack(x.userId, null, { detail: true })
		}))));
