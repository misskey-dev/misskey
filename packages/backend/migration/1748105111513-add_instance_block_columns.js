/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {{ blockedHosts: string[], silencedHosts: string[], mediaSilencedHosts: string[], federationHosts: string[], bubbleInstances: string[] }} Meta
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class AddInstanceBlockColumns1748105111513 {
	name = 'AddInstanceBlockColumns1748105111513'

	async up(queryRunner) {
		// Schema migration
		await queryRunner.query(`ALTER TABLE "instance" ADD "isBlocked" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "instance"."isBlocked" IS 'True if this instance is blocked from federation.'`);
		await queryRunner.query(`ALTER TABLE "instance" ADD "isAllowListed" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "instance"."isAllowListed" IS 'True if this instance is allow-listed.'`);
		await queryRunner.query(`ALTER TABLE "instance" ADD "isBubbled" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "instance"."isBubbled" IS 'True if this instance is part of the local bubble.'`);
		await queryRunner.query(`ALTER TABLE "instance" ADD "isSilenced" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "instance"."isSilenced" IS 'True if this instance is silenced.'`);
		await queryRunner.query(`ALTER TABLE "instance" ADD "isMediaSilenced" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "instance"."isMediaSilenced" IS 'True if this instance is media-silenced.'`);

		// Data migration
		/** @type {Meta[]} */
		const metas = await queryRunner.query(`SELECT "blockedHosts", "silencedHosts", "mediaSilencedHosts", "federationHosts", "bubbleInstances" FROM "meta"`);
		if (metas.length > 0) {
			/** @type {Meta} */
			const meta = metas[0];

			// Blocked hosts
			if (meta.blockedHosts.length > 0) {
				const patterns = buildPatterns(meta.blockedHosts);
				await queryRunner.query(`UPDATE "instance" SET "isBlocked" = true WHERE ((lower(reverse("host")) || '.')::text) LIKE ANY ($1)`, [ patterns ]);
			}

			// Silenced hosts
			if (meta.silencedHosts.length > 0) {
				const patterns = buildPatterns(meta.silencedHosts);
				await queryRunner.query(`UPDATE "instance" SET "isSilenced" = true WHERE ((lower(reverse("host")) || '.')::text) LIKE ANY ($1)`, [ patterns ]);
			}

			// Media silenced hosts
			if (meta.mediaSilencedHosts.length > 0) {
				const patterns = buildPatterns(meta.mediaSilencedHosts);
				await queryRunner.query(`UPDATE "instance" SET "isMediaSilenced" = true WHERE ((lower(reverse("host")) || '.')::text) LIKE ANY ($1)`, [ patterns ]);
			}

			// Allow-listed hosts
			if (meta.federationHosts.length > 0) {
				const patterns = buildPatterns(meta.federationHosts);
				await queryRunner.query(`UPDATE "instance" SET "isAllowListed" = true WHERE ((lower(reverse("host")) || '.')::text) LIKE ANY ($1)`, [ patterns ]);
			}

			// Bubbled hosts
			if (meta.bubbleInstances.length > 0) {
				const patterns = buildPatterns(meta.bubbleInstances);
				await queryRunner.query(`UPDATE "instance" SET "isBubbled" = true WHERE ((lower(reverse("host")) || '.')::text) LIKE ANY ($1)`, [ patterns ]);
			}
		}
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isMediaSilenced"`);
		await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isSilenced"`);
		await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isBubbled"`);
		await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isAllowListed"`);
		await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isBlocked"`);
	}
}

/**
 * @param {string[]} input
 * @returns {string[]}
 */
function buildPatterns(input) {
	return input.map(i => i.toLowerCase().split('').reverse().join('') + '.%');
}
