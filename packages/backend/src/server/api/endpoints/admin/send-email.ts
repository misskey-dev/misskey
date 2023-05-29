import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { EmailService } from '@/core/EmailService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/send-email'> {
	name = 'admin/send-email' as const;
	constructor(
		private emailService: EmailService,
	) {
		super(async (ps, me) => {
			await this.emailService.sendEmail(ps.to, ps.subject, ps.text, ps.text);
		});
	}
}
