import type { LocalUser } from '@/models/entities/User.js';

export type FlashToken = {
	permissions: string[];
	user: LocalUser
};
