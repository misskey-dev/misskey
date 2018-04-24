import * as mongo from 'mongodb';
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
