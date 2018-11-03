import db from '../db/mongodb';

const Emoji = db.get<IEmoji>('emoji');
Emoji.createIndex('name');
Emoji.createIndex('host');
Emoji.createIndex(['name', 'host'], { unique: true });

export default Emoji;

export type IEmoji = {
	name: string;
	host: string;
	url: string;
	aliases?: string[];
	updatedAt?: Date;
};

export const packEmojis = async (
	host: string,
	names?: string[]
) => {
	const query = {
		host
	} as any;

	if (names != null) {
		query.name = { $in: names };
	}

	return await Emoji.find(query, {
		fields: {
			_id: false
		}
	});
};
