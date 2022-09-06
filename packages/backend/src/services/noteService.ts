import { Container, Service, Inject } from 'typedi';
import { Notes } from '@/models/index.js';
import { User } from '@/models/entities/user.js';
import { genId } from '@/misc/gen-id.js';
import { WebhookService } from './webhookService.js';

@Service()
export class NoteService {
	constructor(
		@Inject('notesRepository')
    public notesRepository: typeof Notes,

		public webhookService: WebhookService,
	) {}

	public async create(user: User, data: any) {
		const created = await this.notesRepository.insert({
			...data,
			id: genId(),
			userId: user.id,
			text: data.text + '!!!',
		}).then(x => this.notesRepository.findOneByOrFail(x.identifiers[0]));
		this.webhookService.deliver();
		return created;
	}
}
