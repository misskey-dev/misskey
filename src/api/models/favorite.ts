import * as mongo from 'mongodb';
import db from '../../db/mongodb';

const Favorites = db.get<IFavorites>('favorites');
export default Favorites;

export type IFavorites = {
	_id: mongo.ObjectID;
	createdAt: Date;
	userId: mongo.ObjectID;
	postId: mongo.ObjectID;
};
