import * as deepcopy from 'deepcopy';
import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { Note } from './note';
import { User } from './user';

@Entity()
@Index(['userId', 'noteId'], { unique: true })
export class NoteFavorite {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the NoteFavorite.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24,
	})
	public userId: User['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer')
	public noteId: Note['id'];

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public note: Note | null;
}

export const packMany = (
	favorites: any[],
	me: any
) => {
	return Promise.all(favorites.map(f => pack(f, me)));
};

/**
 * Pack a favorite for API response
 */
export const pack = (
	favorite: any,
	me: any
) => new Promise<any>(async (resolve, reject) => {
	let _favorite: any;

	// Populate the favorite if 'favorite' is ID
	if (isObjectId(favorite)) {
		_favorite = await Favorite.findOne({
			id: favorite
		});
	} else if (typeof favorite === 'string') {
		_favorite = await Favorite.findOne({
			id: new mongo.ObjectID(favorite)
		});
	} else {
		_favorite = deepcopy(favorite);
	}

	// Rename _id to id
	_favorite.id = _favorite.id;
	delete _favorite.id;

	// Populate note
	_favorite.note = await packNote(_favorite.noteId, me, {
		detail: true
	});

	resolve(_favorite);
});
