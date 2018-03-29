import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Favorites = db.get<IFavorite>('favorites');
export default Favorites;

export type IFavorite = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
};
