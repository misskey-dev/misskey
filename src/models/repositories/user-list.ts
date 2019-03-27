import { EntityRepository, Repository } from 'typeorm';
import { UserList } from '../entities/user-list';

@EntityRepository(UserList)
export class UserListRepository extends Repository<UserList> {
	public async pack(
		userList: any,
	) {
		const _userList = typeof userList === 'object' ? userList : await this.findOne(userList);

		return {
			id: _userList.id,
			name: _userList.name
		};
	}
}
