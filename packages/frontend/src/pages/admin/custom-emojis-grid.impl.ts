export type GridItem = {
	id?: string;
	aliases: string;
	name: string;
	category: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: string;
	url: string;
};
