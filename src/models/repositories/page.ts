import { EntityRepository, Repository } from 'typeorm';
import { Page } from '../entities/page';
import { SchemaType, types, bool } from '../../misc/schema';
import { Users } from '..';
import { awaitAll } from '../../prelude/await-all';

export type PackedPage = SchemaType<typeof packedPageSchema>;

@EntityRepository(Page)
export class PageRepository extends Repository<Page> {
	public async pack(
		src: Page,
	): Promise<PackedPage> {
		return await awaitAll({
			id: src.id,
			createdAt: src.createdAt.toISOString(),
			updatedAt: src.updatedAt.toISOString(),
			userId: src.userId,
			user: Users.pack(src.user || src.userId),
			content: src.content,
			variables: src.variables,
			title: src.title,
		});
	}
}

export const packedPageSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
	}
};
