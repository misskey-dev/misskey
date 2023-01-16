import { Inject, Injectable } from '@nestjs/common';
import * as mfm from 'mfm-js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { MfmService } from '@/core/MfmService.js';
import type { Note } from '@/models/entities/Note.js';
import { extractApHashtagObjects } from './models/tag.js';
import type { IObject } from './type.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class ApMfmService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		private mfmService: MfmService,
	) {
	}

	@bindThis
	public htmlToMfm(html: string, tag?: IObject | IObject[]) {
		const hashtagNames = extractApHashtagObjects(tag).map(x => x.name).filter((x): x is string => x != null);
	
		return this.mfmService.fromHtml(html, hashtagNames);
	}

	@bindThis
	public getNoteHtml(note: Note) {
		if (!note.text) return '';
		return this.mfmService.toHtml(mfm.parse(note.text), JSON.parse(note.mentionedRemoteUsers));
	}	
}
