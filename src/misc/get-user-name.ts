import { User } from '@/models/entities/user.js';

export default function(user: User): string {
	return user.name || user.username;
}
