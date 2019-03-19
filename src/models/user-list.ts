import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';

const UserList = db.get<IUserList>('userList');
export default UserList;

export interface IUserList {
	_id: mongo.ObjectID;
	createdAt: Date;
	title: string;
	userId: mongo.ObjectID;
	userIds: mongo.ObjectID[];
}

export const pack = (
	userList: string | mongo.ObjectID | IUserList
) => new Promise<any>(async (resolve, reject) => {
	let _userList: any;

	if (isObjectId(userList)) {
		_userList = await UserList.findOne({
			_id: userList
		});
	} else if (typeof userList === 'string') {
		_userList = await UserList.findOne({
			_id: new mongo.ObjectID(userList)
		});
	} else {
		_userList = deepcopy(userList);
	}

	if (!_userList) throw `invalid userList arg ${userList}`;

	// Rename _id to id
	_userList.id = _userList._id;
	delete _userList._id;

	resolve(_userList);
});
