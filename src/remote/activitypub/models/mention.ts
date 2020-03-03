import { toArray, unique } from '../../../prelude/array';
import { IObject, isMention } from '../type';
import { resolvePerson } from './person';
import * as promiseLimit from 'promise-limit';
import Resolver from '../resolver';
import { User } from '../../../models/entities/user';

export async function extractApMentions(tags: IObject | IObject[] | null | undefined) {
	if (tags == null) return [];

	const hrefs = unique(toArray(tags).filter(isMention).map(x => x.href as string));

	const resolver = new Resolver();

	const limit = promiseLimit<User | null>(2);
	const mentionedUsers = (await Promise.all(
		hrefs.map(x => limit(() => resolvePerson(x, resolver).catch(() => null)))
	)).filter((x): x is User => x != null);

	return mentionedUsers;
}
