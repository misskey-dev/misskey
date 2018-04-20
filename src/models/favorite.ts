import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../db/mongodb';
import { pack as packNote } from './note';

const Favorite = db.get<IFavorite>('favorites');
Favorite.createIndex(['userId', 'noteId'], { unique: true });
export default Favorite;

export type IFavorite = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	noteId: mongo.ObjectID;
};

/**
 * Favoriteを物理削除します
 */
export async function deleteFavorite(favorite: string | mongo.ObjectID | IFavorite) {
	let f: IFavorite;

	// Populate
	if (mongo.ObjectID.prototype.isPrototypeOf(favorite)) {
		f = await Favorite.findOne({
			_id: favorite
		});
	} else if (typeof favorite === 'string') {
		f = await Favorite.findOne({
			_id: new mongo.ObjectID(favorite)
		});
	} else {
		f = favorite as IFavorite;
	}

	if (f == null) return;

	// このFavoriteを削除
	await Favorite.remove({
		_id: f._id
	});
}

/**
 * Pack a favorite for API response
 */
export const pack = (
	favorite: any,
	me: any
) => new Promise<any>(async (resolve, reject) => {
	let _favorite: any;

	// Populate the favorite if 'favorite' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(favorite)) {
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
	_favorite.note = await packNote(_favorite.noteId, me);

	resolve(_favorite);
});
