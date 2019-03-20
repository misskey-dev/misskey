import * as Sequelize from 'sequelize';
import { Table, Column, Model, AllowNull, Comment, ForeignKey } from 'sequelize-typescript';
import { User } from './user';

@Table({
	indexes: [{
		unique: true,
		fields: ['followerId', 'followeeId']
	}, {
		fields: ['followeeId']
	}, {
		fields: ['followerId']
	}]
})
export class Following extends Model<Following> {
	@AllowNull(false)
	@Column(Sequelize.DATE)
	public createdAt: Date;

	@Comment('The followee user ID.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public followeeId: number;

	@Comment('The follower user ID.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public followerId: number;
}
