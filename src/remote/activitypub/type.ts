export type obj = { [x: string]: any };

export interface IObject {
	'@context': string | obj | obj[];
	type: string;
	id?: string;
	summary?: string;
	published?: string;
	cc?: IObject | string | (IObject | string)[];
	to?: IObject | string | (IObject | string)[];
	attributedTo: IObject | string | (IObject | string)[];
	attachment?: any[];
	inReplyTo?: any;
	replies?: ICollection;
	content?: string;
	name?: string;
	startTime?: Date;
	endTime?: Date;
	icon?: any;
	image?: any;
	url?: string;
	tag?: any[];
	sensitive?: boolean;
}

/**
 * Get array of ActivityStreams Objects id
 */
export function getApIds(value: IObject | string | (IObject | string)[] | undefined): string[] {
	if (value == null) return [];
	const array = Array.isArray(value) ? value : [value];
	return array.map(x => getApId(x));
}

/**
 * Get first ActivityStreams Object id
 */
export function getOneApId(value: IObject | string | (IObject | string)[]): string {
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

export interface IActivity extends IObject {
	//type: 'Activity';
	actor: IObject | string;
	object: IObject | string;
	target?: IObject | string;
}

export interface ICollection extends IObject {
	type: 'Collection';
	totalItems: number;
	items: IObject | string | IObject[] | string[];
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	orderedItems: IObject | string | IObject[] | string[];
}

export const validPost = ['Note', 'Question', 'Article', 'Audio', 'Document', 'Image', 'Page', 'Video'];

export interface INote extends IObject {
	type: 'Note' | 'Question' | 'Article' | 'Audio' | 'Document' | 'Image' | 'Page' | 'Video';
	_misskey_content?: string;
	_misskey_quote?: string;
}

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	_misskey_content?: string;
	_misskey_quote?: string;
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

export const validActor = ['Person', 'Service'];

export interface IPerson extends IObject {
	type: 'Person';
	name: string;
	preferredUsername: string;
	manuallyApprovesFollowers: boolean;
	inbox: string;
	sharedInbox?: string;
	publicKey: any;
	followers: any;
	following: any;
	featured?: any;
	outbox: any;
	endpoints: any;
}

export const isCollection = (object: IObject): object is ICollection =>
	object.type === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	object.type === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export interface ICreate extends IActivity {
	type: 'Create';
}

export interface IDelete extends IActivity {
	type: 'Delete';
}

export interface IUpdate extends IActivity {
	type: 'Update';
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
	type: 'Like';
	_misskey_reaction?: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export interface IBlock extends IActivity {
	type: 'Block';
}

export type Object =
	ICollection |
	IOrderedCollection |
	ICreate |
	IDelete |
	IUpdate |
	IUndo |
	IFollow |
	IAccept |
	IReject |
	IAdd |
	IRemove |
	ILike |
	IAnnounce |
	IBlock;
