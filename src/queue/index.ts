import http from './processors/http';
import { ILocalUser } from '../models/user';

export function createHttpJob(data: any) {
	return http({ data }, () => {});
}

export function deliver(user: ILocalUser, content: any, to: any) {
	if (content == null) return;

	createHttpJob({
		type: 'deliver',
		user,
		content,
		to
	});
}
