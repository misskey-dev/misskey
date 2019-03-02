import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import { pack as packNote } from './note';
import { dbLogger } from '../db/logger';

const Favorite = db.get<IFavorite>('favorites');
Favorite.createIndex('userId');
Favorite.createIndex(['userId', 'noteId'], { unique: true });
export default Favorite;

export type IFavorite = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
};

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
	_favorite.id = _favorite._id;
	delete _favorite._id;

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
