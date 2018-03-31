import * as mongodb from 'mongodb';
import db from '../db/mongodb';

const RemoteUserObject = db.get<IRemoteUserObject>('remoteUserObjects');

export default RemoteUserObject;

export type IRemoteUserObject = {
	_id: mongodb.ObjectID;
	uri: string;
	object: {
		$ref: string;
		$id: mongodb.ObjectID;
	}
};
