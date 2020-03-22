import { toArray, unique } from '../../../prelude/array';
import { IObject, isMention, IApMention } from '../type';
import { resolvePerson } from './person';
import * as promiseLimit from 'promise-limit';
import Resolver from '../resolver';
import { User } from '../../../models/entities/user';

export async function extractApMentions(tags: IObject | IObject[] | null | undefined) {
	const hrefs = unique(extractApMentionObjects(tags).map(x => x.href as string));

	const resolver = new Resolver();

	const limit = promiseLimit<User | null>(2);
	const mentionedUsers = (await Promise.all(
		hrefs.map(x => limit(() => resolvePerson(x, resolver).catch(() => null)))
	)).filter((x): x is User => x != null);

	return mentionedUsers;
}

export function extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
	if (tags == null) return [];
	return toArray(tags).filter(isMention);
}
