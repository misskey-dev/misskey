/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import sanitizeHtml from 'sanitize-html';

const textSeparators = ['br', 'p', 'div', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'hr', 'td', 'th', 'section'];

/** Converts HTML descriptions into text while preserving word boundaries. */
export function htmlToPlainText(html: string): string {
	const text = sanitizeHtml(html, {
		allowedTags: textSeparators,
		allowedAttributes: {},
		nonTextTags: ['script', 'style', 'template', 'textarea', 'option', 'xmp'],
	}).replace(/<[^>]+>/gu, ' ');

	// sanitize-html escapes these characters after decoding the input entities.
	return text.replace(/&lt;br\s*\/?&gt;/giu, ' ')
		.replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&')
		.replace(/\s+/gu, ' ').trim();
}
