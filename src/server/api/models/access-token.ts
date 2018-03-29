import * as mongo from 'mongodb';
import db from '../../../db/mongodb';

const AccessToken = db.get<IAccessTokens>('accessTokens');
AccessToken.createIndex('token');
AccessToken.createIndex('hash');
export default AccessToken;

export type IAccessTokens = {
	_id: mongo.ObjectID;
	createdAt: Date;
	appId: mongo.ObjectID;
	userId: mongo.ObjectID;
	token: string;
	hash: string;
};
