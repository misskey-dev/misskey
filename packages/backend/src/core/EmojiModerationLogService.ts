import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EmojiModerationLogsRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { Emoji } from '@/models/entities/Emoji.js';
import { IdService } from '@/core/IdService.js';
import { bindThis } from '@/decorators.js';
import type { LogInfoValue, LogTypeValue } from '@/models/entities/EmojiModerationLog.js';

@Injectable()
export class EmojiModerationLogService {
	constructor(
		@Inject(DI.emojiModerationLogsRepository)
		private emojimoderationLogsRepository: EmojiModerationLogsRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async insertEmojiModerationLog(targetUser: { id: User['id'] }, targetEmoji: { id: Emoji['id'] }, type: LogTypeValue, info?: LogInfoValue[]) {
		await this.emojimoderationLogsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			userId: targetUser.id,
			emojiId: targetEmoji.id,
			type: type,
			info: info ?? [],
		});
	}
}
