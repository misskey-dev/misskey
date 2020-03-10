import { EntityRepository, Repository } from 'typeorm';
import { MutedWord } from '../entities/muted-word';
import { ensure } from '../../prelude/ensure';
import { SchemaType } from '../../misc/schema';

export type PackedMutedWord = SchemaType<typeof packedMutedWordSchema>;

@EntityRepository(MutedWord)
export class MutedWordRepository extends Repository<MutedWord> {
	public async pack(
		src: MutedWord['id'] | MutedWord,
	): Promise<PackedMutedWord> {
		const mutedWord = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: mutedWord.id,
			createdAt: mutedWord.createdAt.toISOString(),
			condition: mutedWord.condition,
		};
	}

	public packMany(
		mutedWords: any[]
	) {
		return Promise.all(mutedWords.map(x => this.pack(x)));
	}
}

export const packedMutedWordSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this MutedWord.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the MutedWord was created.'
		},
		condition: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			description: 'The condition of the MutedWord.'
		},
	},
};
