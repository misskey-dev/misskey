import * as Misskey from 'misskey-js';

export type RegisterLogItem = {
	failed: boolean;
	url: string;
	name: string;
	error?: string;
};

export type GridItem = {
	readonly id?: string;
	readonly fileId?: string;
	readonly url: string;

	checked: boolean;
	name: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: string;
}

export function fromEmojiDetailed(it: Misskey.entities.EmojiDetailed): GridItem {
	return {
		id: it.id,
		fileId: undefined,
		url: it.url,
		checked: false,
		name: it.name,
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
		id: undefined,
		fileId: it.id,
		url: it.url,
		checked: false,
		name: it.name.replace(/(\.[a-zA-Z0-9]+)+$/, ''),
		category: '',
		aliases: '',
		license: '',
		isSensitive: it.isSensitive,
		localOnly: false,
		roleIdsThatCanBeUsedThisEmojiAsReaction: '',
	};
}
