import * as mongo from 'mongodb';
import { Query } from 'cafy';

export const isAnId = x => mongo.ObjectID.isValid(x);
export const isNotAnId = x => !isAnId(x);

/**
 * ID
 */
export default class ID extends Query<mongo.ObjectID> {
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
