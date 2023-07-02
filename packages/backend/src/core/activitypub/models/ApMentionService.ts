import promiseLimit from 'promise-limit';
import { Inject, Injectable } from '@nestjs/common';
import type { User } from '@/models/index.js';
import { toArray, unique } from '@/misc/prelude/array.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import { isMention, type IApMention, type IObject } from '../type.js';
import type { ApPersonService } from './ApPersonService.js';
import type { ApResolverService, Resolver } from '../ApResolverService.js';

@Injectable()
export class ApMentionService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private apResolverService: ApResolverService,
		private apPersonService: ApPersonService,
	) {
	}

	@bindThis
	public async extractApMentions(tags: IObject | IObject[] | null | undefined, resolver: Resolver): Promise<User[]> {
		const hrefs = unique(this.extractApMentionObjects(tags).map(x => x.href));

		const limit = promiseLimit<User | null>(2);
		const mentionedUsers = (await Promise.all(
			hrefs.map(x => limit(() => this.apPersonService.resolvePerson(x, resolver).catch(() => null))),
		)).filter((x): x is User => x != null);

		return mentionedUsers;
	}

	@bindThis
	public extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
		if (tags == null) return [];
		return toArray(tags).filter(isMention);
	}
}
