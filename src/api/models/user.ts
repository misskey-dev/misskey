import db from '../../db/mongodb';

const collection = db.get('users');

(collection as any).index('username'); // fuck type definition
(collection as any).index('token'); // fuck type definition

export default collection;

export function validateUsername(username: string): boolean {
	return /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}

export function isValidBirthday(birthday: string): boolean {
	return /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}
