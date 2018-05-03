import * as mongo from 'mongodb';
import db from '../db/mongodb';

const AccessToken = db.get<IAccessToken>('accessTokens');
AccessToken.createIndex('token');
AccessToken.createIndex('hash');
export default AccessToken;

export type IAccessToken = {
	_id: mongo.ObjectID;
	createdAt: Date;
	appId: mongo.ObjectID;
	userId: mongo.ObjectID;
	token: string;
	hash: string;
};

/**
 * AccessTokenを物理削除します
 */
export async function deleteAccessToken(accessToken: string | mongo.ObjectID | IAccessToken) {
	let a: IAccessToken;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(accessToken)) {
		a = await AccessToken.findOne({
			_id: accessToken
		});
	} else if (typeof accessToken === 'string') {
		a = await AccessToken.findOne({
			_id: new mongo.ObjectID(accessToken)
		});
	} else {
		a = accessToken as IAccessToken;
	}

	if (a == null) return;

	// このAccessTokenを削除
	await AccessToken.remove({
		_id: a._id
	});
}
