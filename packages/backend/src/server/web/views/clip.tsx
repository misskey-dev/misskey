/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function ClipPage(props: CommonProps<{
	clip: Packed<'Clip'>;
	profile: MiUserProfile;
}>) {
	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={props.clip.name} />
				{props.clip.description != null ? <meta property="og:description" content={props.clip.description} /> : null}
				<meta property="og:url" content={`${props.config.url}/clips/${props.clip.id}`} />
				{props.clip.user.avatarUrl ? (
					<>
						<meta property="og:image" content={props.clip.user.avatarUrl} />
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
				<meta name="misskey:user-username" content={props.clip.user.username} />
				<meta name="misskey:user-id" content={props.clip.user.id} />
				<meta name="misskey:clip-id" content={props.clip.id} />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.clip.name} | ${props.instanceName}`}
			desc={props.clip.description ?? ''}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
