/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function AnnouncementPage(props: CommonProps<{
	announcement: Packed<'Announcement'>;
}>) {
	const description = props.announcement.text.length > 100 ? props.announcement.text.slice(0, 100) + '…' : props.announcement.text;

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={props.announcement.title} />
				<meta property="og:description" content={description} />
				<meta property="og:url" content={`${props.config.url}/announcements/${props.announcement.id}`} />
				{props.announcement.imageUrl ? (
					<>
						<meta property="og:image" content={props.announcement.imageUrl} />
						<meta property="twitter:card" content="summary_large_image" />
					</>
				) : null}
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.announcement.title} | ${props.instanceName}`}
			desc={description}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
