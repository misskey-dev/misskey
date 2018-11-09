export default function(x: any): boolean {
	return x.hasOwnProperty('toHexString') || x.hasOwnProperty('_bsontype');
}
