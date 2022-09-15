import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { ModerationLogs } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { IdService } from '@/services/IdService.js';

@Injectable()
export class ModerationLogService {
	constructor(
		@Inject('moderationLogsRepository')
		private moderationLogsRepository: typeof ModerationLogs,

		private idService: IdService,
	) {
	}

	public async insertModerationLog(moderator: { id: User['id'] }, type: string, info?: Record<string, any>) {
		await this.moderationLogsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			userId: moderator.id,
			type: type,
			info: info || {},
		});
	}
}
