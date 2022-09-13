import { Inject, Injectable } from '@nestjs/common';
import promiseLimit from 'promise-limit';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import { toArray, unique } from '@/prelude/array.js';
import type { CacheableUser } from '@/models/entities/user.js';
import { isMention } from '../type.js';
import type { ApResolverService } from '../ApResolverService.js';
import type { IObject , IApMention } from '../type.js';

@Injectable()
export class ApMentionService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		private apResolverService: ApResolverService,
	) {
	}

	public async extractApMentions(tags: IObject | IObject[] | null | undefined) {
		const hrefs = unique(this.extractApMentionObjects(tags).map(x => x.href as string));
	
		const resolver = this.apResolverService.createResolver();
	
		const limit = promiseLimit<CacheableUser | null>(2);
		const mentionedUsers = (await Promise.all(
			hrefs.map(x => limit(() => resolvePerson(x, resolver).catch(() => null))),
		)).filter((x): x is CacheableUser => x != null);
	
		return mentionedUsers;
	}
	
	public extractApMentionObjects(tags: IObject | IObject[] | null | undefined): IApMention[] {
		if (tags == null) return [];
		return toArray(tags).filter(isMention);
	}
}
