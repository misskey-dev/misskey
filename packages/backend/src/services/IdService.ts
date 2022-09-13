import { Inject, Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import { genAid } from '@/misc/id/aid.js';
import { genMeid } from '@/misc/id/meid.js';
import { genMeidg } from '@/misc/id/meidg.js';
import { genObjectId } from '@/misc/id/object-id.js';

@Injectable()
export class IdService {
	#metohd: string;

	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,
	) {
		this.#metohd = config.id.toLowerCase();
	}

	public genId(date?: Date): string {
		if (!date || (date > new Date())) date = new Date();
	
		switch (this.#metohd) {
			case 'aid': return genAid(date);
			case 'meid': return genMeid(date);
			case 'meidg': return genMeidg(date);
			case 'ulid': return ulid(date.getTime());
			case 'objectid': return genObjectId(date);
			default: throw new Error('unrecognized id generation method');
		}
	}
}
