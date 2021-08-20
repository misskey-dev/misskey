import { User } from '@/models/entities/user';

export default function(user: User): string {
	return user.name || user.username;
}
