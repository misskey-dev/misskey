import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Signins } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { Signin } from '@/models/entities/signin.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class SigninEntityService {
	constructor(
		@Inject('signinRepository')
		private signinRepository: typeof Signins,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Signin,
	) {
		return src;
	}
}

