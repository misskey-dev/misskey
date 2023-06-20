import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { GetterService } from '@/server/api/GetterService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'federation/update-remote-user'> {
	name = 'federation/update-remote-user' as const;
	constructor(
		private getterService: GetterService,
		private apPersonService: ApPersonService,
	) {
		super(async (ps) => {
			const user = await this.getterService.getRemoteUser(ps.userId);
			await this.apPersonService.updatePerson(user.uri!);
		});
	}
}
