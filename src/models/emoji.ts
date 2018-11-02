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
	// MeiTODO: filter
) => {
	return await Emoji.find({ host });
};
