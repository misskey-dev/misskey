import * as mongo from 'mongodb';
import db from '../db/mongodb';

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
