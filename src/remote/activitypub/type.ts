export type obj = { [x: string]: any };

export interface IObject {
	'@context': string | obj | obj[];
	type: string;
	id?: string;
	summary?: string;
	published?: string;
	cc?: string[];
	to?: string[];
	attributedTo: string;
	attachment?: any[];
	inReplyTo?: any;
	content: string;
	icon?: any;
	image?: any;
	url?: string;
	tag?: any[];
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

export interface INote extends IObject {
	type: 'Note';
}

export interface IPerson extends IObject {
	type: 'Person';
	name: string;
	preferredUsername: string;
	inbox: string;
	publicKey: any;
	followers: any;
	following: any;
	outbox: any;
	endpoints: string[];
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

export interface IUndo extends IActivity {
	type: 'Undo';
}

export interface IFollow extends IActivity {
	type: 'Follow';
}

export interface IAccept extends IActivity {
	type: 'Accept';
}

export interface ILike extends IActivity {
	type: 'Like';
	_misskey_reaction: string;
}

export interface IAnnounce extends IActivity {
	type: 'Announce';
}

export type Object =
	ICollection |
	IOrderedCollection |
	ICreate |
	IDelete |
	IUndo |
	IFollow |
	IAccept |
	ILike |
	IAnnounce;
