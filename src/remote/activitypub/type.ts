import { ITag } from './models/tag';

type Items = IObject | string | IObject[] | string[];

export interface IObject { // TODO: Better types
	'@context': string | {} | {}[];
	type: string;
	id?: string;
	summary?: string;
	published?: string;
	cc?: string[];
	to?: string[];
	attributedTo: string;
	attachment?: IObject[];
	inReplyTo?: string | IObject;
	replies?: ICollection;
	content?: string;
	name?: string;
	startTime?: Date;
	endTime?: Date;
	icon?: IObject;
	image?: IObject;
	url?: string;
	tag?: ITag[];
	sensitive?: boolean;
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
	items: Items;
}

export interface IOrderedCollection extends IObject {
	type: 'OrderedCollection';
	totalItems: number;
	orderedItems: Items;
}

/**
 * Abstracted one of Collection or OrderedCollection
 */
export interface ICollectionLike extends IObject {
	type: 'Collection' | 'OrderedCollection';
	totalItems: number;
	objects: Items;
	items?: Items;
	orderedItems?: Items;
}

/**
 * Abstracted one of Document or Image
 */
export interface IDocumentLike extends IObject {
	type: 'Document' | 'Image';
}

export interface INote extends IObject {
	type: 'Note' | 'Question';
	_misskey_content?: string;
	_misskey_quote?: string;
	_misskey_question?: string;
}

export interface IQuestion extends IObject {
	type: 'Note' | 'Question';
	_misskey_content?: string;
	_misskey_quote?: string;
	_misskey_question?: string;
	oneOf?: IQuestionChoice[];
	anyOf?: IQuestionChoice[];
	endTime?: Date;
}

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
	publicKey: unknown;
	followers: unknown;
	following: unknown;
	featured?: unknown;
	outbox: unknown;
	endpoints: unknown;
}

export const isCollection = (object: IObject): object is ICollection =>
	object.type === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	object.type === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);

export const isDocumentLike = (object: IObject): object is IDocumentLike =>
	object.type === 'Document' || object.type === 'Image';

export const isNote = (object: IObject): object is INote =>
	object.type === 'Note' || object.type === 'Question';

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
