import * as deepcopy from 'deepcopy';
import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
export class UserList {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the UserList.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The owner ID.'
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 128,
		comment: 'The name of the UserList.'
	})
	public name: string;
}

export const pack = (
	userList: string | mongo.ObjectID | UserList
) => new Promise<any>(async (resolve, reject) => {
	let _userList: any;

	if (isObjectId(userList)) {
		_userList = await UserList.findOne({
			id: userList
		});
	} else if (typeof userList === 'string') {
		_userList = await UserList.findOne({
			id: new mongo.ObjectID(userList)
		});
	} else {
		_userList = deepcopy(userList);
	}

	if (!_userList) throw `invalid userList arg ${userList}`;

	// Rename _id to id
	_userList.id = _userList.id;
	delete _userList.id;

	resolve(_userList);
});
