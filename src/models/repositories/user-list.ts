import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '../entities/user-list';
import { Users, DriveFiles } from '..';

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	private async cloneOrFetch(x: UserList['id'] | UserList): Promise<UserList> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public async pack(
		userList: any,
	) {

		const _userList = await this.cloneOrFetch(userList);

		return {
			id: _userList.id,
			name: _userList.name
		};
	}
}
