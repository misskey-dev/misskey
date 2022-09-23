import { Inject, Injectable } from '@nestjs/common';
import { Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NotesRepository, UsersRepository, BlockingsRepository, PollsRepository, PollVotesRepository } from '@/models/index.js';
import type { Note } from '@/models/entities/Note.js';
import { RelayService } from '@/core/RelayService.js';
import type { CacheableUser } from '@/models/entities/User.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { ApRendererService } from './remote/activitypub/ApRendererService.js';
import { UserEntityService } from './entities/UserEntityService.js';
import { ApDeliverManagerService } from './remote/activitypub/ApDeliverManagerService.js';

@Injectable()
export class PollService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.pollVotesRepository)
		private pollVotesRepository: PollVotesRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private relayService: RelayService,
		private globalEventServie: GlobalEventService,
		private createNotificationService: CreateNotificationService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
	) {
	}

	public async vote(user: CacheableUser, note: Note, choice: number) {
		const poll = await this.pollsRepository.findOneBy({ noteId: note.id });
	
		if (poll == null) throw new Error('poll not found');
	
		// Check whether is valid choice
		if (poll.choices[choice] == null) throw new Error('invalid choice param');
	
		// Check blocking
		if (note.userId !== user.id) {
			const block = await this.blockingsRepository.findOneBy({
				blockerId: note.userId,
				blockeeId: user.id,
			});
			if (block) {
				throw new Error('blocked');
			}
		}
	
		// if already voted
		const exist = await this.pollVotesRepository.findBy({
			noteId: note.id,
			userId: user.id,
		});
	
		if (poll.multiple) {
			if (exist.some(x => x.choice === choice)) {
				throw new Error('already voted');
			}
		} else if (exist.length !== 0) {
			throw new Error('already voted');
		}
	
		// Create vote
		await this.pollVotesRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			noteId: note.id,
			userId: user.id,
			choice: choice,
		});
	
		// Increment votes count
		const index = choice + 1; // In SQL, array index is 1 based
		await this.pollsRepository.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);
	
		this.globalEventServie.publishNoteStream(note.id, 'pollVoted', {
			choice: choice,
			userId: user.id,
		});
	
		// Notify
		this.createNotificationService.createNotification(note.userId, 'pollVote', {
			notifierId: user.id,
			noteId: note.id,
			choice: choice,
		});
	}

	public async deliverQuestionUpdate(noteId: Note['id']) {
		const note = await this.notesRepository.findOneBy({ id: noteId });
		if (note == null) throw new Error('note not found');
	
		const user = await this.usersRepository.findOneBy({ id: note.userId });
		if (user == null) throw new Error('note not found');
	
		if (this.userEntityService.isLocalUser(user)) {
			const content = this.apRendererService.renderActivity(this.apRendererService.renderUpdate(await this.apRendererService.renderNote(note, false), user));
			this.apDeliverManagerService.deliverToFollowers(user, content);
			this.relayService.deliverToRelays(user, content);
		}
	}
}
