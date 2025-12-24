/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function GalleryPostPage(props: CommonProps<{
	galleryPost: Packed<'GalleryPost'>;
	profile: MiUserProfile;
}>) {
	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={props.galleryPost.title} />
				{props.galleryPost.description != null ? <meta property="og:description" content={props.galleryPost.description} /> : null}
				<meta property="og:url" content={`${props.config.url}/gallery/${props.galleryPost.id}`} />
				{props.galleryPost.isSensitive && props.galleryPost.user.avatarUrl ? (
					<>
						<meta property="og:image" content={props.galleryPost.user.avatarUrl} />
						<meta property="twitter:card" content="summary" />
					</>
				) : null}
				{!props.galleryPost.isSensitive && props.galleryPost.files != null ? (
					<>
						<meta property="og:image" content={props.galleryPost.files[0]!.thumbnailUrl ?? props.galleryPost.files[0]!.url} />
						<meta property="twitter:card" content="summary_large_image" />
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
				<meta name="misskey:user-username" content={props.galleryPost.user.username} />
				<meta name="misskey:user-id" content={props.galleryPost.user.id} />
				<meta name="misskey:gallery-post-id" content={props.galleryPost.id} />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.galleryPost.title} | ${props.instanceName}`}
			desc={props.galleryPost.description ?? ''}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
