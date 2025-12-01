/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function FlushPage(props?: {}) {
	return (
		<>
			{'<!DOCTYPE html>'}
			<html>
				<head>
					<meta charset="UTF-8" />
					<meta name="application-name" content="Misskey" />
					<title>Clear preferences and cache</title>
				</head>
				<body>
					<div id="msg"></div>
					<script src="/static-assets/misc/flush.js"></script>
				</body>
			</html>
		</>
	);
}
