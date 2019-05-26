import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '../entities/user-list';
import { ensure } from '../../prelude/ensure';
import { UserListJoinings } from '..';
import { bool, types, SchemaType } from '../../misc/schema';

export type PackedUserList = SchemaType<typeof packedUserListSchema>;

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	public async pack(
		src: UserList['id'] | UserList,
	): Promise<PackedUserList> {
		const userList = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		const users = await UserListJoinings.find({
			userListId: userList.id
		});

		return {
			id: userList.id,
			createdAt: userList.createdAt.toISOString(),
			name: userList.name,
			userIds: users.map(x => x.userId)
		};
	}
}

export const packedUserListSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this UserList.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the UserList was created.'
		},
		name: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			description: 'The name of the UserList.'
		},
		userIds: {
			type: types.array,
			nullable: bool.false, optional: bool.true,
			items: {
				type: types.string,
				nullable: bool.false, optional: bool.false,
				format: 'id',
			}
		},
	},
};
