/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { PackedReversiGameDetailed } from '@/models/schema/reversi-game.js';
import type { CommonProps } from '@/server/web/views/_.js';
import { Layout } from '@/server/web/views/base.js';

export function ReversiGamePage(props: CommonProps<{
	reversiGame: PackedReversiGameDetailed;
}>) {
	const title = `${props.reversiGame.user1.username} vs ${props.reversiGame.user2.username}`;
	const description = `⚫⚪Misskey Reversi⚪⚫`;

	function ogBlock() {
		return (
			<>
				<meta property="og:type" content="article" />
				<meta property="og:title" content={title} />
				<meta property="og:description" content={description} />
				<meta property="og:url" content={`${props.config.url}/reversi/g/${props.reversiGame.id}`} />
				<meta property="twitter:card" content="summary" />
			</>
		);
	}

	return (
		<Layout
			{...props}
			title={`${title} | ${props.instanceName}`}
			desc={description}
			ogSlot={ogBlock()}
		>
		</Layout>
	);
}
