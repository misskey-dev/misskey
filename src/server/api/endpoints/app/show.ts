import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import App, { pack } from '../../../../models/app';
import define from '../../define';
import { error } from '../../../../prelude/promise';

export const meta = {
	params: {
		appId: {
			validator: $.type(ID),
			transform: transform
		},
	}
};

export default define(meta, (ps, user, app) => App.findOne({ _id: ps.appId })
	.then(x =>
		x === null ? error('app not found') :
		pack(x, user, {
			detail: true,
			includeSecret: user && !app && x.userId.equals(user._id)
		})));
