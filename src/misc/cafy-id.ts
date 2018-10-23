import * as mongo from 'mongodb';
import { Context } from 'cafy';
import isObjectId from './is-objectid';

export const isAnId = (x: any) => mongo.ObjectID.isValid(x);
export const isNotAnId = (x: any) => !isAnId(x);

/**
 * ID
 */
export default class ID extends Context<mongo.ObjectID> {
	constructor() {
		super();

		this.transform = v => {
			if (isAnId(v) && !isObjectId(v)) {
				return new mongo.ObjectID(v);
			} else {
				return v;
			}
		};

		this.push(v => {
			if (!isObjectId(v) && isNotAnId(v)) {
				return new Error('must-be-an-id');
			}
			return true;
		});
	}

	public getType() {
		return super.getType('string');
	}
}
