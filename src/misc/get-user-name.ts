import { IUser } from '../models/user';

export default function(user: IUser): string {
	return user.name || '名無し';
}
