import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { EventsRepository, NotesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { IEvent } from '@/models/entities/Event.js';
import { isEvent } from '../type.js';
import { ApLoggerService } from '../ApLoggerService.js';
import { ApResolverService } from '../ApResolverService.js';
import type { Resolver } from '../ApResolverService.js';
import type { IObject } from '../type.js';

@Injectable()
export class ApEventService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.eventsRepository)
		private eventsRepository: EventsRepository,

		private apResolverService: ApResolverService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger;
	}

	@bindThis
	public async extractEventFromNote(source: string | IObject, resolverParam?: Resolver): Promise<IEvent> {
		const resolver = resolverParam ?? this.apResolverService.createResolver();

		const note = await resolver.resolve(source);

		if (!isEvent(note)) {
			throw new Error('invalid type');
		}

		if (note.name && note.startTime) {
			const title = note.name;
			const start = note.startTime;
			const end = note.endTime ?? null;

			return {
				title,
				start,
				end,
				metadata: {
					'@type': 'Event',
					name: note.name,
					url: note.href,
					startDate: note.startTime.toISOString(),
					endDate: note.endTime?.toISOString(),
					description: note.summary,
					identifier: note.id,
				},
			};
		} else {
			throw new Error('Invalid event properties');
		}
	}
}
