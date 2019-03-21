import * as Sequelize from 'sequelize';
import { Table, Column, Model, AllowNull, Comment, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import * as deepcopy from 'deepcopy';
import { pack as packNote, Note } from './note';
import { dbLogger } from '../db/logger';

@Table({
	indexes: [{
		unique: true,
		fields: ['userId', 'noteId']
	}, {
		fields: ['userId']
	}]
})
export class Favorite extends Model<Favorite> {
	@AllowNull(false)
	@Column(Sequelize.DATE)
	public createdAt: Date;

	@Comment('The user ID.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public userId: number;

	@BelongsTo(() => User, {
		foreignKey: 'userId',
		onDelete: 'CASCADE'
	})
	public user: User;

	@Comment('The note ID.')
	@AllowNull(false)
	@ForeignKey(() => Note)
	@Column(Sequelize.INTEGER)
	public noteId: number;

	@BelongsTo(() => Note, {
		foreignKey: 'noteId',
		onDelete: 'CASCADE'
	})
	public note: Note;
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
			_id: favorite
		});
	} else if (typeof favorite === 'string') {
		_favorite = await Favorite.findOne({
			_id: new mongo.ObjectID(favorite)
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

	// (データベースの不具合などで)投稿が見つからなかったら
	if (_favorite.note == null) {
		dbLogger.warn(`[DAMAGED DB] (missing) pkg: favorite -> note :: ${_favorite.id} (note ${_favorite.noteId})`);
		return resolve(null);
	}

	resolve(_favorite);
});
