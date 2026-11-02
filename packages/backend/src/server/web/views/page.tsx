/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function PagePage(props: CommonProps<{
	page: Packed<'Page'>;
	profile: MiUserProfile;
}>) {
	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={props.page.title} />
				{props.page.summary != null ? <meta property="og:description" content={props.page.summary} /> : null}
				<meta property="og:url" content={`${props.config.url}/pages/${props.page.id}`} />
				{props.page.eyeCatchingImage != null ? (
					<>
						<meta property="og:image" content={props.page.eyeCatchingImage.thumbnailUrl ?? props.page.eyeCatchingImage.url} />
						<meta property="twitter:card" content="summary_large_image" />
					</>
				) : props.page.user.avatarUrl ? (
					<>
						<meta property="og:image" content={props.page.user.avatarUrl} />
						<meta property="twitter:card" content="summary" />
					</>
				) : null}
			</>
		);
	}

	function metaBlock() {
		return (
			<>
				{props.profile.noCrawle ? <meta name="robots" content="noindex" /> : null}
				{props.profile.preventAiLearning ? (
					<>
						<meta name="robots" content="noimageai" />
						<meta name="robots" content="noai" />
					</>
				) : null}
				<meta name="misskey:user-username" content={props.page.user.username} />
				<meta name="misskey:user-id" content={props.page.user.id} />
				<meta name="misskey:page-id" content={props.page.id} />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.page.title} | ${props.instanceName}`}
			desc={props.page.summary ?? ''}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
