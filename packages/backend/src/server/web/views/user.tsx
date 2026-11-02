/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function UserPage(props: CommonProps<{
	user: Packed<'UserDetailed'>;
	profile: MiUserProfile;
	sub?: string;
}>) {
	const title = props.user.name ? `${props.user.name} (@${props.user.username}${props.user.host ? `@${props.user.host}` : ''})` : `@${props.user.username}${props.user.host ? `@${props.user.host}` : ''}`;
	const me = props.profile.fields
		? props.profile.fields
			.filter(field => field.value != null && field.value.match(/^https?:/))
			.map(field => field.value)
		: [];

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="blog" />
				<meta property="og:title" content={title} />
				{props.user.description != null ? <meta property="og:description" content={props.user.description} /> : null}
				<meta property="og:url" content={`${props.config.url}/@${props.user.username}`} />
				<meta property="og:image" content={props.user.avatarUrl} />
				<meta property="twitter:card" content="summary" />
			</>
		);
	}

	function metaBlock() {
		return (
			<>
				{props.user.host != null || props.profile.noCrawle ? <meta name="robots" content="noindex" /> : null}
				{props.profile.preventAiLearning ? (
					<>
						<meta name="robots" content="noimageai" />
						<meta name="robots" content="noai" />
					</>
				) : null}
				<meta name="misskey:user-username" content={props.user.username} />
				<meta name="misskey:user-id" content={props.user.id} />

				{props.sub == null && props.federationEnabled ? (
					<>
						{props.user.host == null ? <link rel="alternate" type="application/activity+json" href={`${props.config.url}/users/${props.user.id}`} /> : null}
						{props.user.uri != null ? <link rel="alternate" type="application/activity+json" href={props.user.uri} /> : null}
						{props.profile.url != null ? <link rel="alternate" type="text/html" href={props.profile.url} /> : null}
					</>
				) : null}

				{me.map((url) => (
					<link rel="me" href={url} />
				))}
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.user.name || props.user.username} (@${props.user.username}) | ${props.instanceName}`}
			desc={props.user.description ?? ''}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
