import * as Misskey from 'misskey-js';

export class GridItem {
	readonly id?: string;
	readonly url?: string;
	readonly blob?: Blob;

	public aliases: string;
	public name: string;
	public category: string;
	public license: string;
	public isSensitive: boolean;
	public localOnly: boolean;
	public roleIdsThatCanBeUsedThisEmojiAsReaction: string;

	private readonly origin: string;

	private constructor(
		id: string | undefined,
		url: string | undefined = undefined,
		blob: Blob | undefined = undefined,
		aliases: string,
		name: string,
		category: string,
		license: string,
		isSensitive: boolean,
		localOnly: boolean,
		roleIdsThatCanBeUsedThisEmojiAsReaction: string,
	) {
		this.id = id;
		this.url = url;
		this.blob = blob;

		this.aliases = aliases;
		this.name = name;
		this.category = category;
		this.license = license;
		this.isSensitive = isSensitive;
		this.localOnly = localOnly;
		this.roleIdsThatCanBeUsedThisEmojiAsReaction = roleIdsThatCanBeUsedThisEmojiAsReaction;

		this.origin = JSON.stringify(this);
	}

	static ofEmojiDetailed(it: Misskey.entities.EmojiDetailed): GridItem {
		return new GridItem(
			it.id,
			it.url,
			undefined,
			it.aliases.join(', '),
			it.name,
			it.category ?? '',
			it.license ?? '',
			it.isSensitive,
			it.localOnly,
			it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(', '),
		);
	}

	public get edited(): boolean {
		const { origin, ..._this } = this;
		return JSON.stringify(_this) !== origin;
	}
}
