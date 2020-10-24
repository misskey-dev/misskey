import { IRemoteUser } from '../../../../models/entities/user';
import config from '../../../../config';
import { IFlag, getApIds } from '../../type';
import { AbuseUserReports, Users } from '../../../../models';
import { In } from 'typeorm';
import { genId } from '../../../../misc/gen-id';

export default async (actor: IRemoteUser, activity: IFlag): Promise<string> => {
	// objectは `(User|Note) | (User|Note)[]` だけど、全パターンDBスキーマと対応させられないので
	// 対象ユーザーは一番最初のユーザー として あとはコメントとして格納する
	const uris = getApIds(activity.object);

	const userIds = uris.filter(uri => uri.startsWith(config.url + '/users/')).map(uri => uri.split('/').pop());
	const users = await Users.find({
		id: In(userIds)
	});
	if (users.length < 1) return `skip`;

	await AbuseUserReports.insert({
		id: genId(),
		createdAt: new Date(),
		targetUserId: users[0].id,
		targetUserHost: users[0].host,
		reporterId: actor.id,
		reporterHost: actor.host,
		comment: `${activity.content}\n${JSON.stringify(uris, null, 2)}`
	});

	return `ok`;
};
