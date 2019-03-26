import * as deepcopy from 'deepcopy';
import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user';
import { id } from '../id';

@Entity()
@Index(['muterId', 'muteeId'], { unique: true })
export class Muting {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the Muting.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		...id(),
		comment: 'The mutee user ID.'
	})
	public muteeId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public mutee: User | null;

	@Index()
	@Column({
		...id(),
		comment: 'The muter user ID.'
	})
	public muterId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public muter: User | null;
}

export const packMany = (
	mutes: (string | mongo.ObjectID | IMute)[],
	me?: string | mongo.ObjectID | User
) => {
	return Promise.all(mutes.map(x => pack(x, me)));
};

export const pack = (
	mute: any,
	me?: any
) => new Promise<any>(async (resolve, reject) => {
	let _mute: any;

	// Populate the mute if 'mute' is ID
	if (isObjectId(mute)) {
		_mute = await Mute.findOne({
			id: mute
		});
	} else if (typeof mute === 'string') {
		_mute = await Mute.findOne({
			id: new mongo.ObjectID(mute)
		});
	} else {
		_mute = deepcopy(mute);
	}

	// Rename _id to id
	_mute.id = _mute.id;
	delete _mute.id;

	// Populate mutee
	_mute.mutee = await packUser(_mute.muteeId, me, {
		detail: true
	});

	resolve(_mute);
});
