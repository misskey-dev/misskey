import { User } from '../models/user';

export default function(user: User): string {
	return user.name || user.username;
}
