import { ObjectID } from 'mongodb';

export default function(x: any): x is ObjectID {
	return typeof x === 'object' && (x.hasOwnProperty('toHexString') || x.hasOwnProperty('_bsontype'));
}
