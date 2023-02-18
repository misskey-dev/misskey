import { Inject, Injectable } from '@/di-decorators.js';
import { DI } from '@/di-symbols.js';
import type { SigninsRepository } from '@/models/index.js';
import type { } from '@/models/entities/Blocking.js';
import type { Signin } from '@/models/entities/Signin.js';
import { UserEntityService } from './UserEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class SigninEntityService {
	constructor(
		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		@Inject(DI.UserEntityService)
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

