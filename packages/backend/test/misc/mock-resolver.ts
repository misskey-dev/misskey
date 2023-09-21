import type { Config } from '@/config.js';
import type { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import type { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import type { ApRequestService } from '@/core/activitypub/ApRequestService.js';
import { Resolver } from '@/core/activitypub/ApResolverService.js';
import type { IObject } from '@/core/activitypub/type.js';
import type { HttpRequestService } from '@/core/HttpRequestService.js';
import type { InstanceActorService } from '@/core/InstanceActorService.js';
import type { LoggerService } from '@/core/LoggerService.js';
import type { MetaService } from '@/core/MetaService.js';
import type { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import type { NoteReactionsRepository, NotesRepository, PollsRepository, UsersRepository } from '@/models/index.js';

type MockResponse = {
	type: string;
	content: string;
};

export class MockResolver extends Resolver {
	private _rs = new Map<string, MockResponse>();

	constructor(loggerService: LoggerService) {
		super(
			{} as Config,
			{} as UsersRepository,
			{} as NotesRepository,
			{} as PollsRepository,
			{} as NoteReactionsRepository,
			{} as UtilityService,
			{} as InstanceActorService,
			{} as MetaService,
			{} as ApRequestService,
			{} as HttpRequestService,
			{} as ApRendererService,
			{} as ApDbResolverService,
			loggerService,
		);
	}

	public async _register(uri: string, content: string | Record<string, any>, type = 'application/activity+json') {
		this._rs.set(uri, {
			type,
			content: typeof content === 'string' ? content : JSON.stringify(content),
		});
	}

	@bindThis
	public async resolve(value: string | IObject): Promise<IObject> {
		if (typeof value !== 'string') return value;

		const r = this._rs.get(value);

		if (!r) {
			throw {
				name: 'StatusError',
				statusCode: 404,
				message: 'Not registed for mock',
			};
		}

		const object = JSON.parse(r.content);

		return object;
	}
}
