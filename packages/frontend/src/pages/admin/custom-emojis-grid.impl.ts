import * as Misskey from 'misskey-js';

export interface IGridItem {
	readonly id?: string;
	readonly fileId?: string;
	readonly url: string;

	name: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: string;
}

export class GridItem implements IGridItem {
	readonly id?: string;
	readonly fileId?: string;
	readonly url: string;

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
		fileId: string | undefined,
		url: string,
		name: string,
		category: string,
		aliases: string,
		license: string,
		isSensitive: boolean,
		localOnly: boolean,
		roleIdsThatCanBeUsedThisEmojiAsReaction: string,
	) {
		this.id = id;
		this.fileId = fileId;
		this.url = url;

		this.aliases = aliases;
		this.name = name;
		this.category = category;
		this.license = license;
		this.isSensitive = isSensitive;
		this.localOnly = localOnly;
		this.roleIdsThatCanBeUsedThisEmojiAsReaction = roleIdsThatCanBeUsedThisEmojiAsReaction;

		this.origin = JSON.stringify(this);
	}

	static fromEmojiDetailed(it: Misskey.entities.EmojiDetailed): GridItem {
		return new GridItem(
			it.id,
			undefined,
			it.url,
			it.name,
			it.category ?? '',
			it.aliases.join(', '),
			it.license ?? '',
			it.isSensitive,
			it.localOnly,
			it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(', '),
		);
	}

	static fromDriveFile(it: Misskey.entities.DriveFile): GridItem {
		return new GridItem(
			undefined,
			it.id,
			it.url,
			it.name.replace(/\.[a-zA-Z0-9]+$/, ''),
			'',
			'',
			'',
			it.isSensitive,
			false,
			'',
		);
	}

	public get edited(): boolean {
		const { origin, ..._this } = this;
		return JSON.stringify(_this) !== origin;
	}

	public asRecord(): Record<string, never> {
		return this as Record<string, never>;
	}
}
