import * as mongo from 'mongodb';
import db from '../db/mongodb';

const Emoji = db.get<IEmoji>('emoji');
Emoji.createIndex('name');
Emoji.createIndex('host');
Emoji.createIndex(['name', 'host'], { unique: true });

export default Emoji;

export type IEmoji = {
	_id: mongo.ObjectID;
	name: string;
	host: string;
	url: string;
	aliases?: string[];
	updatedAt?: Date;
};

export const packEmojis = async (
	host: string,
	// MeiTODO: filter
) => {
	return await Emoji.find({ host }, {
		fields: {
			_id: false
		}
	});
};
