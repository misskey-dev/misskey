import * as Misskey from 'misskey-js';

export type RegisterLogItem = {
	failed: boolean;
	url: string;
	name: string;
	error?: string;
};

export type GridItem = {
	checked: boolean;
	id?: string;
	fileId?: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: string;
}

export function fromEmojiDetailed(it: Misskey.entities.EmojiDetailed): GridItem {
	return {
		checked: false,
		id: it.id,
		fileId: undefined,
		url: it.url,
		name: it.name,
		host: it.host ?? '',
		category: it.category ?? '',
		aliases: it.aliases.join(', '),
		license: it.license ?? '',
		isSensitive: it.isSensitive,
		localOnly: it.localOnly,
		roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(', '),
	};
}

export function fromDriveFile(it: Misskey.entities.DriveFile): GridItem {
	return {
		checked: false,
		id: undefined,
		fileId: it.id,
		url: it.url,
		name: it.name.replace(/(\.[a-zA-Z0-9]+)+$/, ''),
		host: '',
		category: '',
		aliases: '',
		license: '',
		isSensitive: it.isSensitive,
		localOnly: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: '',
	};
}
