import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user';
import { id } from '../../../id';

@Entity()
export class ReversiMatching {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the ReversiMatching.'
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public parentId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public parent: User | null;

	@Index()
	@Column(id())
	public childId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public child: User | null;
}

/**
 * Pack an reversi matching for API response
 */
export const pack = (
	matching: any,
	me?: string | mongo.ObjectID | User
) => new Promise<any>(async (resolve, reject) => {

	// Me
	const meId: mongo.ObjectID = me
		? isObjectId(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as User).id
		: null;

	const _matching = deepcopy(matching);

	// Rename _id to id
	_matching.id = _matching.id;
	delete _matching.id;

	// Populate user
	_matching.parent = await packUser(_matching.parentId, meId);
	_matching.child = await packUser(_matching.childId, meId);

	resolve(_matching);
});
