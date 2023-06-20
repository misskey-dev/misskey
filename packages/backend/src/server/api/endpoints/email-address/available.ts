import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmailService } from '@/core/EmailService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'email-address/available'> {
	name = 'email-address/available' as const;
	constructor(
		private emailService: EmailService,
	) {
		super(async (ps, me) => {
			return await this.emailService.validateEmailForAccount(ps.emailAddress);
		});
	}
}
