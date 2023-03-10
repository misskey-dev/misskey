import { getRequiredService, IServiceProvider } from 'yohira';
import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { NoteReactionsRepository } from '@/models/index.js';
import type { Packed } from '@/misc/json-schema.js';
import { bindThis } from '@/decorators.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { NoteReaction } from '@/models/entities/NoteReaction.js';
import type { ReactionService } from '../ReactionService.js';
import type { UserEntityService } from './UserEntityService.js';
import type { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteReactionEntityService {
	constructor(
		@Inject(IServiceProvider)
		private serviceProvider: IServiceProvider,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		// @Inject(DI.UserEntityService)
		// private userEntityService: UserEntityService,

		// @Inject(DI.NoteEntityService)
		// private noteEntityService: NoteEntityService,

		// @Inject(DI.ReactionService)
		// private reactionService: ReactionService,
	) {
	}

	// HACK: for circular dependency
	private get userEntityService(): UserEntityService {
		return getRequiredService(this.serviceProvider, DI.UserEntityService);
	}
	private get noteEntityService(): NoteEntityService {
		return getRequiredService(this.serviceProvider, DI.NoteEntityService);
	}
	private get reactionService(): ReactionService {
		return getRequiredService(this.serviceProvider, DI.ReactionService);
	}

	@bindThis
	public async pack(
		src: NoteReaction['id'] | NoteReaction,
		me?: { id: User['id'] } | null | undefined,
		options?: {
			withNote: boolean;
		},
	): Promise<Packed<'NoteReaction'>> {
		const opts = Object.assign({
			withNote: false,
		}, options);

		const reaction = typeof src === 'object' ? src : await this.noteReactionsRepository.findOneByOrFail({ id: src });

		return {
			id: reaction.id,
			createdAt: reaction.createdAt.toISOString(),
			user: await this.userEntityService.pack(reaction.user ?? reaction.userId, me),
			type: this.reactionService.convertLegacyReaction(reaction.reaction),
			...(opts.withNote ? {
				note: await this.noteEntityService.pack(reaction.note ?? reaction.noteId, me),
			} : {}),
		};
	}
}
