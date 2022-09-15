import { Inject, Injectable } from '@nestjs/common';
import { Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Notes, Users , Blockings } from '@/models/index.js';
import { Polls , PollVotes } from '@/models/index.js';
import type { Note } from '@/models/entities/Note.js';
import { RelayService } from '@/services/RelayService.js';
import type { CacheableUser } from '@/models/entities/User.js';
import { IdService } from '@/services/IdService.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { CreateNotificationService } from '@/services/CreateNotificationService.js';
import renderUpdate from '@/services/remote/activitypub/renderer/update.js';
import { renderActivity } from '@/services/remote/activitypub/renderer/index.js';
import renderNote from '@/services/remote/activitypub/renderer/note.js';

@Injectable()
export class PollService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('pollsRepository')
		private pollsRepository: typeof Polls,

		@Inject('pollVotesRepository')
		private pollVotesRepository: typeof PollVotes,

		@Inject('blockingsRepository')
		private blockingsRepository: typeof Blockings,

		private idService: IdService,
		private relayService: RelayService,
		private globalEventServie: GlobalEventService,
		private createNotificationService: CreateNotificationService,
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
		await PollVotes.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			noteId: note.id,
			userId: user.id,
			choice: choice,
		});
	
		// Increment votes count
		const index = choice + 1; // In SQL, array index is 1 based
		await Polls.query(`UPDATE poll SET votes[${index}] = votes[${index}] + 1 WHERE "noteId" = '${poll.noteId}'`);
	
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
			const content = renderActivity(renderUpdate(await renderNote(note, false), user));
			deliverToFollowers(user, content);
			this.relayService.deliverToRelays(user, content);
		}
	}
}
