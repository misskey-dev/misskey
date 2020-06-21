export type obj = { [x: string]: any };
export type ApObject = IObject | string | (IObject | string)[];

export interface IObject {
	'@context': string | obj | obj[];
	type: string;
	id?: string;
	summary?: string;
	published?: string;
	cc?: ApObject;
	to?: ApObject;
	attributedTo: ApObject;
	attachment?: any[];
	inReplyTo?: any;
	replies?: ICollection;
	content?: string;
	name?: string;
	startTime?: Date;
	endTime?: Date;
	icon?: any;
	image?: any;
	url?: ApObject;
	href?: string;
	tag?: IObject | IObject[];
	sensitive?: boolean;
}

/**
 * Get array of ActivityStreams Objects id
 */
export function getApIds(value: ApObject | undefined): string[] {
	if (value == null) return [];
	const array = Array.isArray(value) ? value : [value];
	return array.map(x => getApId(x));
}

/**
 * Get first ActivityStreams Object id
 */
export function getOneApId(value: ApObject): string {
	const firstOne = Array.isArray(value) ? value[0] : value;
	return getApId(firstOne);
}

/**
 * Get ActivityStreams Object id
 */
export function getApId(value: string | IObject): string {
	if (typeof value === 'string') return value;
	if (typeof value.id === 'string') return value.id;
	throw new Error(`cannot detemine id`);
}

export function getOneApHrefNullable(value: ApObject | undefined): string | undefined {
	const firstOne = Array.isArray(value) ? value[0] : value;
	return getApHrefNullable(firstOne);
}

export function getApHrefNullable(value: string | IObject | undefined): string | undefined {
	if (typeof value === 'string') return value;
	if (typeof value?.href === 'string') return value.href;
	return undefined;
}

export interface IActivity extends IObject {
	//type: 'Activity';
	actor: IObject | string;
	object: IObject | string;
	target?: IObject | string;
	/** LD-Signature */
	signature?: {
		type: string;
		created: Date;
		creator: string;
		domain?: string;
		nonce?: string;
		signatureValue: string;
	};
}

export interface ICollection extends IObject {
	type: 'Collection';
	totalItems: number;
	items: ApObject;
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	orderedItems: ApObject;
}

export const validPost = ['Note', 'Question', 'Article', 'Audio', 'Document', 'Image', 'Page', 'Video', 'Event'];

export interface IPost extends IObject {
	type: 'Note' | 'Question' | 'Article' | 'Audio' | 'Document' | 'Image' | 'Page' | 'Video' | 'Event';
	_misskey_content?: string;
	_misskey_quote?: string;
	quoteUrl?: string;
	_misskey_talk: boolean;
}

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	_misskey_content?: string;
	_misskey_quote?: string;
	quoteUrl?: string;
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
	closed?: Date;
}

export const isQuestion = (object: IObject): object is IQuestion =>
	object.type === 'Note' || object.type === 'Question';

interface IQuestionChoice {
	name?: string;
	replies?: ICollection;
	_misskey_votes?: number;
}

export const validActor = ['Person', 'Service', 'Group', 'Organization', 'Application'];

export interface IPerson extends IObject {
	type: 'Person' | 'Service' | 'Organization' | 'Group' | 'Application';
	name?: string;
	preferredUsername?: string;
	manuallyApprovesFollowers?: boolean;
	inbox?: string;
	sharedInbox?: string;	// 後方互換性のため
	publicKey: {
		id: string;
		publicKeyPem: string;
	};
	followers?: string | ICollection | IOrderedCollection;
	following?: string | ICollection | IOrderedCollection;
	featured?: string | IOrderedCollection;
	outbox?: string | IOrderedCollection;
	endpoints?: {
		sharedInbox?: string;
	};
	'vcard:bday'?: string;
	'vcard:Address'?: string;
}

export const isCollection = (object: IObject): object is ICollection =>
	object.type === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	object.type === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export interface IApPropertyValue extends IObject {
	type: 'PropertyValue';
	identifier: IApPropertyValue;
	name: string;
	value: string;
}

export const isPropertyValue = (object: IObject): object is IApPropertyValue =>
	object &&
	object.type === 'PropertyValue' &&
	typeof object.name === 'string' &&
	typeof (object as any).value === 'string';

export interface IApMention extends IObject {
	type: 'Mention';
	href: string;
}

export const isMention = (object: IObject): object is IApMention=>
	object.type === 'Mention' &&
	typeof object.href === 'string';

export interface IApHashtag extends IObject {
	type: 'Hashtag';
	name: string;
}

export const isHashtag = (object: IObject): object is IApHashtag =>
	object.type === 'Hashtag' &&
	typeof object.name === 'string';

export interface IApEmoji extends IObject {
	type: 'Emoji';
	updated: Date;
}

export const isEmoji = (object: IObject): object is IApEmoji =>
	object.type === 'Emoji' && !Array.isArray(object.icon) && object.icon.url != null;

export interface ICreate extends IActivity {
	type: 'Create';
}

export interface IDelete extends IActivity {
	type: 'Delete';
}

export interface IUpdate extends IActivity {
	type: 'Update';
}

export interface IRead extends IActivity {
	type: 'Read';
}

export interface IUndo extends IActivity {
	type: 'Undo';
}

export interface IFollow extends IActivity {
	type: 'Follow';
}

export interface IAccept extends IActivity {
	type: 'Accept';
}

export interface IReject extends IActivity {
	type: 'Reject';
}

export interface IAdd extends IActivity {
	type: 'Add';
}

export interface IRemove extends IActivity {
	type: 'Remove';
}

export interface ILike extends IActivity {
	type: 'Like' | 'EmojiReaction' | 'EmojiReact';
	_misskey_reaction?: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export interface IBlock extends IActivity {
	type: 'Block';
}

export interface IFlag extends IActivity {
	type: 'Flag';
}

export const isCreate = (object: IObject): object is ICreate => object.type === 'Create';
export const isDelete = (object: IObject): object is IDelete => object.type === 'Delete';
export const isUpdate = (object: IObject): object is IUpdate => object.type === 'Update';
export const isRead = (object: IObject): object is IRead => object.type === 'Read';
export const isUndo = (object: IObject): object is IUndo => object.type === 'Undo';
export const isFollow = (object: IObject): object is IFollow => object.type === 'Follow';
export const isAccept = (object: IObject): object is IAccept => object.type === 'Accept';
export const isReject = (object: IObject): object is IReject => object.type === 'Reject';
export const isAdd = (object: IObject): object is IAdd => object.type === 'Add';
export const isRemove = (object: IObject): object is IRemove => object.type === 'Remove';
export const isLike = (object: IObject): object is ILike => object.type === 'Like' || object.type === 'EmojiReaction' || object.type === 'EmojiReact';
export const isAnnounce = (object: IObject): object is IAnnounce => object.type === 'Announce';
export const isBlock = (object: IObject): object is IBlock => object.type === 'Block';
export const isFlag = (object: IObject): object is IFlag => object.type === 'Flag';
