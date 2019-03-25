import { ulid } from 'ulid';

// v11 TODO
export function genId(): string {
	return ulid().toLowerCase();
}
