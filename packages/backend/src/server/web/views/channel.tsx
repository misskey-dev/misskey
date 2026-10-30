/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@/misc/json-schema.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function ChannelPage(props: CommonProps<{
	channel: Packed<'Channel'>;
}>) {

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="website" />
				<meta property="og:title" content={props.channel.name} />
				{props.channel.description != null ? <meta property="og:description" content={props.channel.description} /> : null}
				<meta property="og:url" content={`${props.config.url}/channels/${props.channel.id}`} />
				{props.channel.bannerUrl ? (
					<>
						<meta property="og:image" content={props.channel.bannerUrl} />
						<meta property="twitter:card" content="summary" />
					</>
				) : null}
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${props.channel.name} | ${props.instanceName}`}
			desc={props.channel.description ?? undefined}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
