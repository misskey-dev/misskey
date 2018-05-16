import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../db/mongodb';

const UserList = db.get<IUserList>('userList');
export default UserList;

export interface IUserList {
	_id: mongo.ObjectID;
	createdAt: Date;
	title: string;
	userId: mongo.ObjectID;
	userIds: mongo.ObjectID[];
}

/**
 * UserListを物理削除します
 */
export async function deleteUserList(userList: string | mongo.ObjectID | IUserList) {
	let u: IUserList;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(userList)) {
		u = await UserList.findOne({
			_id: userList
		});
	} else if (typeof userList === 'string') {
		u = await UserList.findOne({
			_id: new mongo.ObjectID(userList)
		});
	} else {
		u = userList as IUserList;
	}

	if (u == null) return;

	// このUserListを削除
	await UserList.remove({
		_id: u._id
	});
}

export const pack = (
	userList: string | mongo.ObjectID | IUserList
) => new Promise<any>(async (resolve, reject) => {
	let _userList: any;

	if (mongo.ObjectID.prototype.isPrototypeOf(userList)) {
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
