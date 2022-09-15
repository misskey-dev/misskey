import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MfmService } from '@/services/MfmService.js';
import type { IObject } from './type';

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
