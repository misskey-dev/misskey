/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function ApiDocPage() {
	return (
		<>
			{'<!DOCTYPE html>'}
			<html>
				<head>
					<meta charset="UTF-8" />
					<title>Misskey API</title>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<style>
						{`body { margin: 0; padding: 0; }`}
					</style>
				</head>
				<body>
					<script id="api-reference" data-url="/api.json"></script>
					<script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
				</body>
			</html>
		</>
	);
}
