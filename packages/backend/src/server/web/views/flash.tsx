/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function FlashPage(props: CommonProps<{
	flash: Packed<'Flash'>;
	profile: MiUserProfile;
}>) {
	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={props.flash.title} />
				<meta property="og:description" content={props.flash.summary} />
				<meta property="og:url" content={`${props.config.url}/play/${props.flash.id}`} />
				{props.flash.user.avatarUrl ? (
					<>
						<meta property="og:image" content={props.flash.user.avatarUrl} />
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
				<meta name="misskey:user-username" content={props.flash.user.username} />
				<meta name="misskey:user-id" content={props.flash.user.id} />
				<meta name="misskey:flash-id" content={props.flash.id} />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.flash.title} | ${props.instanceName}`}
			desc={props.flash.summary}
			metaSlot={metaBlock()}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
