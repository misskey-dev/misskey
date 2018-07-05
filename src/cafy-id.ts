import * as mongo from 'mongodb';
import { Context } from 'cafy';

export const isAnId = (x: any) => mongo.ObjectID.isValid(x);
export const isNotAnId = (x: any) => !isAnId(x);

/**
 * ID
 */
export default class ID extends Context<mongo.ObjectID> {
	constructor() {
		super();

		this.transform = v => {
			if (isAnId(v) && !mongo.ObjectID.prototype.isPrototypeOf(v)) {
				return new mongo.ObjectID(v);
			} else {
				return v;
			}
		};

		this.push(v => {
			if (!mongo.ObjectID.prototype.isPrototypeOf(v) && isNotAnId(v)) {
				return new Error('must-be-an-id');
			}
			return true;
		});
	}
}
