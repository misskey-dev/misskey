import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { Config } from '@/config.js';
import { MfmService } from '@/services/MfmService.js';
import { extractApHashtagObjects } from './models/tag.js';
import type { IObject } from './type.js';

@Injectable()
export class ApMfmService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private mfmService: MfmService,
	) {
	}

	public htmlToMfm(html: string, tag?: IObject | IObject[]) {
		const hashtagNames = extractApHashtagObjects(tag).map(x => x.name).filter((x): x is string => x != null);
	
		return this.mfmService.fromHtml(html, hashtagNames);
	}
}
