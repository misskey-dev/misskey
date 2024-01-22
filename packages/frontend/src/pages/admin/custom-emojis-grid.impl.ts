import * as Misskey from 'misskey-js';

export class GridItem {
	readonly id?: string;
	readonly url?: string;
	readonly blob?: Blob;

	public name: string;
	public category: string;
	public aliases: string;
	public license: string;
	public isSensitive: boolean;
	public localOnly: boolean;
	public roleIdsThatCanBeUsedThisEmojiAsReaction: string;

	private readonly origin: string;

	constructor(
		id: string | undefined,
		url: string | undefined = undefined,
		blob: Blob | undefined = undefined,
		name: string,
		category: string,
		aliases: string,
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
		return new GridItem(it.id, it.url, undefined, it.name, it.category ?? '', it.aliases.join(', '), it.license ?? '', it.isSensitive, it.localOnly, it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(', '));
	}

	public get edited(): boolean {
		const { origin, ..._this } = this;
		return JSON.stringify(_this) !== origin;
	}

	public asRecord(): Record<string, unknown> {
		return this as Record<string, unknown>;
	}
}
