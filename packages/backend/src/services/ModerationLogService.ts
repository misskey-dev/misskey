import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { ModerationLogs } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';

@Injectable()
export class ModerationLogService {
	constructor(
		@Inject('moderationLogsRepository')
		private moderationLogsRepository: typeof ModerationLogs,
	) {
	}

	public async insertModerationLog(moderator: { id: User['id'] }, type: string, info?: Record<string, any>) {
		await this.moderationLogsRepository.insert({
			id: genId(),
			createdAt: new Date(),
			userId: moderator.id,
			type: type,
			info: info || {},
		});
	}
}
