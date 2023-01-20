import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, UsersRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';

const ACHIEVEMENT_TYPES = [
	'bfb4bbb19d5042138db3ae32f23c4aa2',
	'86d5a0fdb382426ab0f01a1a2a9c287f',
	'7263a10c843d4c26986987850d9ce326',
	'af59e72ebddf484a97f5333778a56e48',
	'0dcc42f5aeb44e5eb79c4f1dd7100216',
	'329670f100504846988729b1f392395e',
	'47c1ccc95ba245df8bb1bf245bd9f517',
	'814b0d6655ad4379a28f46b67c188559',
	'ef26b5bd8e8b49438779f4a2c80de4ee',
	'd046b1342f9d46c192f899be14cf614a',
	'98c11358616746b7afbee3190851dfa4',
	'8d770b0cdda648caa1b1ae920ecd19e6',
	'dc7733a48033407082d20accffc74763',
	'1b2308ad4bec49deb62d24b62452c58c',
	'c7f0e1f9df2c4798a3785501caef3d14',
	'560f644ae17b40c282f0ee90c9939f56',
	'f2c2ef3eed2a46e2928a3b90ea763c2d',
	'b158c3154a9244779d644af4a7b3907d',
	'e1fb8e59f4fc4a0f9d7e5747a103ff16',
	'3dc5e086638e414e9bd9f605a46cbb5a',
	'db2496a32a9c47a2ace6271fb10c9890',
	'4d5abaebc2924792a97d548d4c7c09fe',
	'ba6688fa24a3475185a460d11dad47b2',
	'30d049b4deeb4d1382a6702307fd9b8a',
	'098fc6d1af604e9588cf2d637870355b',
	'455365961ef14786af76b15917b3accd',
	'e9abbdb33ce04a42b62798d4d001c614',
	'52dff3050a4a430db49b8f943d03d8d4',
	'173c61f28a934efbbc5342294b9a13a0',
	'a7cb1d292c494008822d69fc02f95e4c',
	'e3d7be8f803a47b698c38cc727e0462b',
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
