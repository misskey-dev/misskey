import { ObjectID } from 'mongodb';

export default function(x: any): x is ObjectID {
	return x.hasOwnProperty('toHexString') || x.hasOwnProperty('_bsontype');
}
