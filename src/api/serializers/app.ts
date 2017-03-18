/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import App from '../models/app';
import AccessToken from '../models/access-token';
import config from '../../conf';

/**
 * Serialize an app
 *
 * @param {any} app
 * @param {any} me?
 * @param {any} options?
 * @return {Promise<any>}
 */
export default (
	app: any,
	me?: any,
	options?: {
		includeSecret?: boolean,
		includeProfileImageIds?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = options || {
		includeSecret: false,
		includeProfileImageIds: false
	};

	let _app: any;

	// Populate the app if 'app' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(app)) {
		_app = await App.findOne({
			_id: app
		});
	} else if (typeof app === 'string') {
		_app = await App.findOne({
			_id: new mongo.ObjectID(app)
		});
	} else {
		_app = deepcopy(app);
	}

	// Me
	if (me && !mongo.ObjectID.prototype.isPrototypeOf(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me._id;
		}
	}

	// Rename _id to id
	_app.id = _app._id;
	delete _app._id;

	delete _app.name_id_lower;

	// Visible by only owner
	if (!opts.includeSecret) {
		delete _app.secret;
	}

	_app.icon_url = _app.icon != null
		? `${config.drive_url}/${_app.icon}`
		: `${config.drive_url}/app-default.jpg`;

	if (me) {
		// 既に連携しているか
		const exist = await AccessToken.count({
			app_id: _app.id,
			user_id: me,
		}, {
				limit: 1
			});

		_app.is_authorized = exist === 1;
	}

	resolve(_app);
});
