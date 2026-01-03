/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AiService {
	constructor(
	) {
	}

	@bindThis
	public async detectSensitive(source: string | Buffer): Promise<null> {
		return null;
	}
}
