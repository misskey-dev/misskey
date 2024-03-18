/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UrlPreviewMeta1710512074000 {
    name = 'UrlPreviewMeta1710512074000'

    async up(queryRunner) {
        await queryRunner.query(`
					alter table meta
						rename column "summalyProxy" to "urlPreviewSummaryProxyUrl";
					alter table meta
						add "urlPreviewEnabled" boolean default true not null;
					alter table meta
						add "urlPreviewTimeout" integer default 10000 not null;
					alter table meta
						add "urlPreviewMaximumContentLength" bigint default 10485760 not null;
					alter table meta
						add "urlPreviewRequireContentLength" boolean default false not null;
					alter table meta
						add "urlPreviewUserAgent" varchar(1024) default null;
				`);
    }

    async down(queryRunner) {
        await queryRunner.query(`
					alter table meta
						rename column "urlPreviewSummaryProxyUrl" to "summalyProxy";
					alter table meta
						drop column "urlPreviewEnabled";
					alter table meta
						drop column "urlPreviewTimeout";
					alter table meta
						drop column "urlPreviewMaximumContentLength";
					alter table meta
						drop column "urlPreviewRequireContentLength";
					alter table meta
						drop column "urlPreviewUserAgent";
				`);
    }
}
