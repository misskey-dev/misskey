import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import { Notes, UserNotePinings } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { User } from '@/models/entities/user.js';
import type { Note } from '@/models/entities/note.js';
import { IdService } from '@/services/IdService.js';
import type { UserNotePining } from '@/models/entities/user-note-pining.js';
import { RelayService } from '@/services/RelayService.js';
import { Config } from '@/config.js';

@Injectable()
export class NotePiningService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('userNotePiningsRepository')
		private userNotePiningsRepository: typeof UserNotePinings,

		private idService: IdService,
		private relayService: RelayService,
	) {
	}

	/**
	 * 指定した投稿をピン留めします
	 * @param user
	 * @param noteId
	 */
	public async addPinned(user: { id: User['id']; host: User['host']; }, noteId: Note['id']) {
	// Fetch pinee
		const note = await Notes.findOneBy({
			id: noteId,
			userId: user.id,
		});

		if (note == null) {
			throw new IdentifiableError('70c4e51f-5bea-449c-a030-53bee3cce202', 'No such note.');
		}

		const pinings = await this.userNotePiningsRepository.findBy({ userId: user.id });

		if (pinings.length >= 5) {
			throw new IdentifiableError('15a018eb-58e5-4da1-93be-330fcc5e4e1a', 'You can not pin notes any more.');
		}

		if (pinings.some(pining => pining.noteId === note.id)) {
			throw new IdentifiableError('23f0cf4e-59a3-4276-a91d-61a5891c1514', 'That note has already been pinned.');
		}

		await this.userNotePiningsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			userId: user.id,
			noteId: note.id,
		} as UserNotePining);

		// Deliver to remote followers
		if (this.userEntityService.isLocalUser(user)) {
			deliverPinnedChange(user.id, note.id, true);
		}
	}

	/**
	 * 指定した投稿のピン留めを解除します
	 * @param user
	 * @param noteId
	 */
	public async removePinned(user: { id: User['id']; host: User['host']; }, noteId: Note['id']) {
	// Fetch unpinee
		const note = await Notes.findOneBy({
			id: noteId,
			userId: user.id,
		});

		if (note == null) {
			throw new IdentifiableError('b302d4cf-c050-400a-bbb3-be208681f40c', 'No such note.');
		}

		UserNotePinings.delete({
			userId: user.id,
			noteId: note.id,
		});

		// Deliver to remote followers
		if (this.userEntityService.isLocalUser(user)) {
			deliverPinnedChange(user.id, noteId, false);
		}
	}

	public async deliverPinnedChange(userId: User['id'], noteId: Note['id'], isAddition: boolean) {
		const user = await this.usersRepository.findOneBy({ id: userId });
		if (user == null) throw new Error('user not found');

		if (!this.userEntityService.isLocalUser(user)) return;

		const target = `${this.config.url}/users/${user.id}/collections/featured`;
		const item = `${this.config.url}/notes/${noteId}`;
		const content = renderActivity(isAddition ? renderAdd(user, target, item) : renderRemove(user, target, item));

		deliverToFollowers(user, content);
		this.relayService.deliverToRelays(user, content);
	}
}
