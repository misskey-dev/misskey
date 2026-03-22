/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import type {
	NoctownPlayersRepository,
	NoctownPlayerScoresRepository,
	UsersRepository,
} from '@/models/_.js';
import { ApiError } from '@/server/api/error.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';

export const meta = {
	tags: ['noctown'],
	requireCredential: true,
	kind: 'write:notes',

	res: {
		type: 'object',
		properties: {
			success: { type: 'boolean' },
			noteId: { type: 'string', nullable: true },
		},
	},

	errors: {
		playerNotFound: {
			message: 'Player not found.',
			code: 'PLAYER_NOT_FOUND',
			id: 'c1d2e3f4-0027-0001-0001-000000000001',
		},
		scoreNotFound: {
			message: 'Score not found.',
			code: 'SCORE_NOT_FOUND',
			id: 'c1d2e3f4-0027-0001-0001-000000000002',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		category: {
			type: 'string',
			enum: ['total', 'balance', 'item', 'quest', 'speed'],
			default: 'total',
		},
		visibility: {
			type: 'string',
			enum: ['public', 'home', 'followers'],
			default: 'public',
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.noctownPlayersRepository)
		private noctownPlayersRepository: NoctownPlayersRepository,

		@Inject(DI.noctownPlayerScoresRepository)
		private noctownPlayerScoresRepository: NoctownPlayerScoresRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private noteCreateService: NoteCreateService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const player = await this.noctownPlayersRepository.findOneBy({ userId: me.id });
			if (!player) {
				throw new ApiError(meta.errors.playerNotFound);
			}

			// Get player's score
			const score = await this.noctownPlayerScoresRepository.findOneBy({ playerId: player.id });
			if (!score) {
				throw new ApiError(meta.errors.scoreNotFound);
			}

			// Get category-specific score and rank
			const category = ps.category ?? 'total';
			const columnMap: Record<string, string> = {
				total: 'totalScore',
				balance: 'balanceScore',
				item: 'itemScore',
				quest: 'questScore',
				speed: 'speedScore',
			};
			const column = columnMap[category];
			const categoryScore = (score as unknown as Record<string, number>)[column];

			// Calculate rank
			const higherCount = await this.noctownPlayerScoresRepository
				.createQueryBuilder('score')
				.where(`score.${column} > :score`, { score: categoryScore })
				.getCount();
			const rank = higherCount + 1;

			// Get total players for context
			const totalPlayers = await this.noctownPlayerScoresRepository.count();

			// Category display names
			const categoryNames: Record<string, string> = {
				total: '総合',
				balance: '資産',
				item: 'アイテム収集',
				quest: 'クエスト',
				speed: '効率',
			};

			// Generate share text
			const categoryName = categoryNames[category] ?? '総合';
			const percentile = Math.floor((1 - rank / totalPlayers) * 100);

			let rankEmoji = '';
			if (rank === 1) rankEmoji = ' 👑';
			else if (rank <= 3) rankEmoji = ' 🏆';
			else if (rank <= 10) rankEmoji = ' 🥇';
			else if (rank <= 50) rankEmoji = ' 🎖️';

			const text = `ノクタウン ${categoryName}ランキング${rankEmoji}

📊 スコア: ${categoryScore.toLocaleString()}
🏅 順位: ${rank}位 / ${totalPlayers}人
📈 上位${100 - percentile}%

#ノクタウン #Noctown`;

			// Create note
			const user = await this.usersRepository.findOneByOrFail({ id: me.id });
			const note = await this.noteCreateService.create(user, {
				text,
				visibility: ps.visibility ?? 'public',
			});

			return {
				success: true,
				noteId: note.id,
			};
		});
	}
}
