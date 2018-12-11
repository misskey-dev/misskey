import * as mongo from 'mongodb';
import { Context } from 'cafy';
import isObjectId from './is-objectid';

export const isAnId = (x: any) => mongo.ObjectID.isValid(x);
export const isNotAnId = (x: any) => !isAnId(x);
export const transform = (x: string | mongo.ObjectID): mongo.ObjectID =>
	x && (isAnId(x) && !isObjectId(x) ? new mongo.ObjectID(x) : x as mongo.ObjectID);

export const transformMany = (xs: (string | mongo.ObjectID)[]): mongo.ObjectID[] =>
	xs && xs.map(x => transform(x));

export type ObjectId = mongo.ObjectID;

/**
 * ID
 */
export default class ID extends Context<string> {
	constructor() {
		super();

		this.push((v: any) => isObjectId(v) && isNotAnId(v) ? true : new Error('must-be-an-id'));
	}

	public getType() {
		return super.getType('string');
	}
}
