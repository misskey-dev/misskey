/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const getNodeOrNull = (input: unknown): Node | null => {
	if (input instanceof Node) return input;
	return null;
};

export const getElementOrNull = (input: unknown): Element | null => {
	if (input instanceof Element) return input;
	return null;
};

export const getHTMLElementOrNull = (input: unknown): HTMLElement | null => {
	if (input instanceof HTMLElement) return input;
	return null;
};
