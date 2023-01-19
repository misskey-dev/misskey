import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';

const ACHIEVEMENT_TYPES = [
	'justSettingUpMyMsky',
	'myFirstFollow',
	'myFirstFollower',
	'iLoveMisskey',
	'nocturnality',
] as const;

@Injectable()
export class AchievementService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private createNotificationService: CreateNotificationService,
	) {
	}

	@bindThis
	public async create(
		userId: User['id'],
		type: string,
	): Promise<void> {
		if (!ACHIEVEMENT_TYPES.includes(type)) return;

		const date = Date.now();

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: userId });

		if (profile.achievements.some(a => a.name === type)) return;

		await this.userProfilesRepository.update(userId, {
			achievements: [...profile.achievements, {
				name: type,
				unlockedAt: date,
			}],
		});

		this.createNotificationService.createNotification(userId, 'achievementEarned', {
			achievement: type,
		});
	}
}
