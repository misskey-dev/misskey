import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import AccessToken from './access-token';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import config from '../config';

const App = db.get<IApp>('apps');
App.createIndex('secret');
export default App;

export type IApp = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID | null;
	secret: string;
	name: string;
	description: string;
	permission: string[];
	callbackUrl: string;
};

/**
 * Pack an app for API response
 */
export const pack = (
	app: any,
	me?: any,
	options?: {
		detail?: boolean,
		includeSecret?: boolean,
		includeProfileImageIds?: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false,
		includeSecret: false,
		includeProfileImageIds: false
	}, options);

	let _app: any;

	const fields = opts.detail ? {} : {
		name: true
	};

	// Populate the app if 'app' is ID
	if (isObjectId(app)) {
		_app = await App.findOne({
			_id: app
		});
	} else if (typeof app === 'string') {
		_app = await App.findOne({
			_id: new mongo.ObjectID(app)
		}, { fields });
	} else {
		_app = deepcopy(app);
	}

	// Me
	if (me && !isObjectId(me)) {
		if (typeof me === 'string') {
			me = new mongo.ObjectID(me);
		} else {
			me = me._id;
		}
	}

	// Rename _id to id
	_app.id = _app._id;
	delete _app._id;

	// Visible by only owner
	if (!opts.includeSecret) {
		delete _app.secret;
	}

	_app.iconUrl = _app.icon != null
		? `${config.driveUrl}/${_app.icon}`
		: `${config.driveUrl}/app-default.jpg`;

	if (me) {
		// 既に連携しているか
		const exist = await AccessToken.count({
			appId: _app.id,
			userId: me,
		}, {
				limit: 1
			});

		_app.isAuthorized = exist === 1;
	}

	resolve(_app);
});
