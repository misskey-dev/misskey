import { ModerationLogs } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { User } from '@/models/entities/user';

export async function insertModerationLog(moderator: { id: User['id'] }, type: string, info?: Record<string, any>) {
	await ModerationLogs.insert({
		id: genId(),
		createdAt: new Date(),
		userId: moderator.id,
		type: type,
		info: info || {}
	});
}
