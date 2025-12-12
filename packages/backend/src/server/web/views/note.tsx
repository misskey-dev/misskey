/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';
import { isRenotePacked } from '@/misc/is-renote.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';

export function NotePage(props: CommonProps<{
	note: Packed<'Note'>;
	profile: MiUserProfile;
}>) {
	const title = props.note.user.name ? `${props.note.user.name} (@${props.note.user.username}${props.note.user.host ? `@${props.note.user.host}` : ''})` : `@${props.note.user.username}${props.note.user.host ? `@${props.note.user.host}` : ''}`
	const isRenote = isRenotePacked(props.note);
	const images = (props.note.files ?? []).filter(f => f.type.startsWith('image/'));
	const videos = (props.note.files ?? []).filter(f => f.type.startsWith('video/'));
	const summary = getNoteSummary(props.note);

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={summary} />
				<meta property="og:url" content={`${props.config.url}/notes/${props.note.id}`} />
				{videos.map(video => (
					<>
						<meta property="og:video:url" content={video.url} />
						<meta property="og:video:secure_url" content={video.url} />
						<meta property="og:video:type" content={video.type} />
						{video.thumbnailUrl ? <meta property="og:video:image" content={video.thumbnailUrl} /> : null}
						{video.properties.width != null ? <meta property="og:video:width" content={video.properties.width.toString()} /> : null}
						{video.properties.height != null ? <meta property="og:video:height" content={video.properties.height.toString()} /> : null}
					</>
				))}
				{images.length > 0 ? (
					<>
						<meta property="twitter:card" content="summary_large_image" />
						{images.map(image => (
							<>
								<meta property="og:image" content={image.url} />
								{image.properties.width != null ? <meta property="og:image:width" content={image.properties.width.toString()} /> : null}
								{image.properties.height != null ? <meta property="og:image:height" content={image.properties.height.toString()} /> : null}
							</>
						))}
					</>
				) : (
					<>
						<meta property="twitter:card" content="summary" />
						<meta property="og:image" content={props.note.user.avatarUrl} />
					</>
				)}
			</>
		);
	}

	function metaBlock() {
		return (
			<>
				{props.note.user.host != null || isRenote || props.profile.noCrawle ? <meta name="robots" content="noindex" /> : null}
				{props.profile.preventAiLearning ? (
					<>
						<meta name="robots" content="noimageai" />
						<meta name="robots" content="noai" />
					</>
				) : null}
				<meta name="misskey:user-username" content={props.note.user.username} />
				<meta name="misskey:user-id" content={props.note.user.id} />
				<meta name="misskey:note-id" content={props.note.id} />

				{props.federationEnabled ? (
					<>
						{props.note.user.host == null ? <link rel="alternate" type="application/activity+json" href={`${props.config.url}/notes/${props.note.id}`} /> : null}
						{props.note.uri != null ? <link rel="alternate" type="application/activity+json" href={props.note.uri} /> : null}
					</>
				) : null}
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${title} | ${props.instanceName}`}
			desc={summary}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		></Layout>
	)
}
