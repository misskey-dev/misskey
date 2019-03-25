import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
export class Signin {
	@PrimaryColumn('char', { length: 26 })
	public id: string;

	@Column('date', {
		comment: 'The created date of the Signin.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer')
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Column('varchar', {
		length: 128,
	})
	public ip: string;

	@Column('jsonb')
	public headers: Record<string, any>;

	@Column('boolean')
	public success: boolean;
}

/**
 * Pack a signin record for API response
 *
 * @param {any} record
 * @return {Promise<any>}
 */
export const pack = (
	record: any
) => new Promise<any>(async (resolve, reject) => {

	const _record = deepcopy(record);

	// Rename _id to id
	_record.id = _record.id;
	delete _record.id;

	resolve(_record);
});
