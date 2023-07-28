/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { SigninsRepository } from '@/models/index.js';
import type { } from '@/models/entities/Blocking.js';
import type { Signin } from '@/models/entities/Signin.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class SigninEntityService {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Signin,
	) {
		return src;
	}
}

