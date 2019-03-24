import * as deepcopy from 'deepcopy';
import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';

@Entity()
@Index(['blockerId', 'blockeeId'], { unique: true })
export class Blocking {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the Blocking.'
	})
	public createdAt: Date;

	@Index()
	@Column('integer', {
		comment: 'The blockee user ID.'
	})
	public blockeeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public blockee: User | null;

	@Index()
	@Column('integer', {
		comment: 'The blocker user ID.'
	})
	public blockerId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public blocker: User | null;
}

export const packMany = (
	blockings: (string | mongo.ObjectID | IBlocking)[],
	me?: string | mongo.ObjectID | User
) => {
	return Promise.all(blockings.map(x => pack(x, me)));
};

export const pack = (
	blocking: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _blocking: any;

	// Populate the blocking if 'blocking' is ID
	if (isObjectId(blocking)) {
		_blocking = await Blocking.findOne({
			id: blocking
		});
	} else if (typeof blocking === 'string') {
		_blocking = await Blocking.findOne({
			id: new mongo.ObjectID(blocking)
		});
	} else {
		_blocking = deepcopy(blocking);
	}

	// Rename _id to id
	_blocking.id = _blocking.id;
	delete _blocking.id;

	// Populate blockee
	_blocking.blockee = await packUser(_blocking.blockeeId, me, {
		detail: true
	});

	resolve(_blocking);
});
