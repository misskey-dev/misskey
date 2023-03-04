import { db } from '@/db/postgre.js';
import { Packed } from '@/misc/schema.js';
import { RenoteMuting } from '@/models/entities/RenoteMuting.js';
import { User } from '@/models/entities/user.js';
import { awaitAll } from '@/prelude/await-all.js';
import { Users } from '../index.js';

export const RenoteMutingRepository = db.getRepository(RenoteMuting).extend({
	async pack(
		src: RenoteMuting['id'] | RenoteMuting,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'RenoteMuting'>> {
		const muting = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return await awaitAll({
			id: muting.id,
			createdAt: muting.createdAt.toISOString(),
			muteeId: muting.muteeId,
			mutee: Users.pack(muting.muteeId, me, {
				detail: true,
			}),
		});
	},

	packMany(
		mutings: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(mutings.map(x => this.pack(x, me)));
	},
});
