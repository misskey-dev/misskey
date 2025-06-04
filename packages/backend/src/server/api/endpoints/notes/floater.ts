/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { DataSource } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { MiLocalUser } from '@/models/User.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		anchorId: { type: 'string', format: 'misskey:id' },
		anchorDate: { type: 'integer' },
		offset: { type: 'integer', minimum: 0, default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.db)
		private db: DataSource,

		private noteEntityService: NoteEntityService,
		private activeUsersChart: ActiveUsersChart,
		private idService: IdService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const anchorId = ps.anchorId ?? this.idService.gen(ps.anchorDate);

			const updates = await this.getFromDb({
				anchorId,
				offset: ps.offset,
				limit: ps.limit,
			}, me);

			process.nextTick(() => {
				this.activeUsersChart.read(me);
			});

			for (const update of updates) {
				update.notes = await this.noteEntityService.packMany(update.notes, me);
			}
			return updates;
		});
	}

	// getFromDb メソッドをシンプル化
	private async getFromDb(ps: {
		anchorId: string | null;
		offset: number;
		limit: number;
	}, me: MiLocalUser) {
		// フォローしているユーザーと、フォローしていないローカルユーザーのパブリック投稿、両方を含むクエリ
		const updatedUsers = await this.db.query(`
            WITH local_active_users AS (
                -- フォローしているユーザーと最近投稿したローカルユーザーを取得
                SELECT DISTINCT u.id AS "userId"
                FROM "user" u
                LEFT JOIN "following" f ON u.id = f."followeeId" AND f."followerId" = $1
                JOIN "note" n ON u.id = n."userId"
                WHERE
                    -- ローカルユーザーのみ
                    u."host" IS NULL
                    -- anchorId以降に投稿がある
                    AND n."id" > $2
                    -- パブリック投稿
                    AND n."visibility" IN ('public')
                    -- リノート・リプライを除外
                    AND n."renoteId" IS NULL
                    AND n."replyId" IS NULL
                    -- やみモードフィルタリング
                    AND (n."isNoteInYamiMode" = FALSE OR $5 = TRUE)
            ),
            user_last_posts AS (
                -- 各ユーザーの最後の投稿（anchorId以前）を取得
                SELECT
                    lau."userId",
                    (
                        SELECT "id"
                        FROM "note"
                        WHERE "userId" = lau."userId"
                            AND "id" <= $2
                            AND "visibility" IN ('public')
                            AND "renoteId" IS NULL
                            AND "replyId" IS NULL
                            AND ("isNoteInYamiMode" = FALSE OR $5 = TRUE)
                        ORDER BY "id" DESC
                        LIMIT 1
                    ) AS last_post_id,
                    -- 初浮上かどうかを判定する部分を追加
                    NOT EXISTS (
                        SELECT 1 FROM "note"
                        WHERE "userId" = lau."userId"
                            AND "id" < $2
                            AND "visibility" IN ('public')
                            AND "renoteId" IS NULL
                            AND "replyId" IS NULL
                            AND ("isNoteInYamiMode" = FALSE OR $5 = TRUE)
                    ) AS is_first_public_post,
                    -- フォロー状態
                    EXISTS (
                        SELECT 1 FROM "following"
                        WHERE "followerId" = $1 AND "followeeId" = lau."userId"
                    ) AS is_following
                FROM local_active_users lau
            )
            -- フォロー状態順 + 最後の投稿古い順 + オフセット + リミット
            SELECT
                "userId" AS user,
                last_post_id AS last,
                is_following,
                is_first_public_post
            FROM user_last_posts
            ORDER BY
                -- フォロー中ユーザーを優先
                is_following DESC,
                -- 最後の投稿が古いか存在しない（初投稿）ユーザーを優先
                last_post_id ASC NULLS FIRST
            OFFSET $3
            LIMIT $4
        `, [me.id, ps.anchorId, ps.offset, ps.limit, me.isInYamiMode]);

		return await Promise.all(updatedUsers.map(async (row) => {
			const userId = row.user;
			const query = this.notesRepository.createQueryBuilder('note').innerJoinAndSelect('note.user', 'user');

			// 標準の可視性クエリ
			this.queryService.generateVisibilityQuery(query, me);

			// フォローしていないユーザーの場合は明示的にパブリック投稿のみに制限
			if (!row.is_following && userId !== me.id) {
				query.andWhere('note.visibility = :visibility', { visibility: 'public' });
			}

			// やみモード投稿のフィルタリング
			if (!(me.isInYamiMode)) {
				query.andWhere('note.isNoteInYamiMode = FALSE');
			}

			this.queryService.generateMutedUserQueryForNotes(query, me);
			this.queryService.generateBlockedUserQueryForNotes(query, me);
			this.queryService.generateMutedUserRenotesQueryForNotes(query, me);

			query.andWhere('note.renoteId IS NULL');
			query.andWhere('note.replyId IS NULL');
			query.andWhere('note.userId = :userId', { userId });
			query.andWhere('note.id > :anchorId', { anchorId: ps.anchorId });
			query.orderBy('note.id', 'DESC');
			query.limit(3);

			// isFollowing 情報を追加
			return {
				id: userId,
				notes: await query.getMany(),
				last: row.last,
				isFirstPublicPost: row.is_first_public_post, // 初浮上情報を追加
				isFollowing: row.is_following,
			};
		}));
	}
}
