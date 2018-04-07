export type Object = { [x: string]: any };

export type ActivityType =
	'Create';

export interface IObject {
	'@context': string | object | any[];
	type: string;
	id?: string;
	summary?: string;
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

export const isCollection = (object: IObject): object is ICollection =>
	object.type === 'Collection';

export const isOrderedCollection = (object: IObject): object is IOrderedCollection =>
	object.type === 'OrderedCollection';

export const isCollectionOrOrderedCollection = (object: IObject): object is ICollection | IOrderedCollection =>
	isCollection(object) || isOrderedCollection(object);
