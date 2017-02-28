import db from '../../db/mongodb';

const collection = db.get('users');

(collection as any).index('username'); // fuck type definition
(collection as any).index('token'); // fuck type definition

export default collection as any; // fuck type definition

export function validateUsername(username: string): boolean {
	return typeof username == 'string' && /^[a-zA-Z0-9\-]{3,20}$/.test(username);
}

export function validatePassword(password: string): boolean {
	return typeof password == 'string' && password != '';
}

export function isValidBirthday(birthday: string): boolean {
	return typeof birthday == 'string' && /^([0-9]{4})\-([0-9]{2})-([0-9]{2})$/.test(birthday);
}

export interface IUser {
	name: string;
}
