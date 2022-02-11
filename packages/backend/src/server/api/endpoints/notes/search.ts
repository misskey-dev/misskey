import $ from "cafy";
import searchClient from "../../../../db/searchClient";
import define from "../../define";
import { Notes } from "@/models/index";
import { In } from "typeorm";
import { ID } from "@/misc/cafy-id";
import config from "@/config/index";
import { makePaginationQuery } from "../../common/make-pagination-query";
import { generateVisibilityQuery } from "../../common/generate-visibility-query";
import { generateMutedUserQuery } from "../../common/generate-muted-user-query";
import { generateBlockedUserQuery } from "../../common/generate-block-query";

export const meta = {
	tags: ["notes"],

	requireCredential: false,

	params: {
		query: {
			validator: $.str,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		host: {
			validator: $.optional.nullable.str,
			default: undefined,
		},

		userId: {
			validator: $.optional.nullable.type(ID),
			default: null,
		},

		channelId: {
			validator: $.optional.nullable.type(ID),
			default: null,
		},
	},

	res: {
		type: "array",
		optional: false,
		nullable: false,
		items: {
			type: "object",
			optional: false,
			nullable: false,
			ref: "Note",
		},
	},

	errors: {},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	if (searchClient == null) {
		const query = makePaginationQuery(
			Notes.createQueryBuilder("note"),
			ps.sinceId,
			ps.untilId
		);

		if (ps.userId) {
			query.andWhere("note.userId = :userId", { userId: ps.userId });
		} else if (ps.channelId) {
			query.andWhere("note.channelId = :channelId", {
				channelId: ps.channelId,
			});
		}

		query
			.andWhere("note.text ILIKE :q", { q: `%${ps.query}%` })
			.innerJoinAndSelect("note.user", "user")
			.leftJoinAndSelect("note.reply", "reply")
			.leftJoinAndSelect("note.renote", "renote")
			.leftJoinAndSelect("reply.user", "replyUser")
			.leftJoinAndSelect("renote.user", "renoteUser");

		generateVisibilityQuery(query, me);
		if (me) generateMutedUserQuery(query, me);
		if (me) generateBlockedUserQuery(query, me);

		const notes = await query.take(ps.limit!).getMany();

		return await Notes.packMany(notes, me);
	} else {
		const hits = await searchClient.search(ps.query, {
			userHost: ps.host,
			userId: ps.userId,
		});

		if (hits.length === 0) return [];

		const notes = await Notes.find({
			where: {
				id: In(hits),
			},
			order: {
				id: -1,
			},
		});

		return await Notes.packMany(notes, me);
	}
});
