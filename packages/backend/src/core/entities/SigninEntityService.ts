import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { SigninsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Signin } from '@/models/entities/Signin.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class SigninEntityService {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Signin,
	) {
		return src;
	}
}

