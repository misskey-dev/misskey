/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function renderFrontendDiagnosticsMarkdown(bundleMarkdown: string, browserMarkdown: string) {
	return [
		'# Frontend Diagnostics',
		'',
		bundleMarkdown.trim(),
		'',
		browserMarkdown.trim(),
	].join('\n') + '\n';
}
