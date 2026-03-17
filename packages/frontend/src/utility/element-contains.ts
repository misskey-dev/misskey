/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function elementContains(parent: Element | null, child: Element | null, checkSame = true) {
	if (parent === null || child === null) return false;
	if (checkSame && parent === child) return true;
	let node = child.parentNode;
	while (node) {
		if (node === parent) return true;
		node = node.parentNode;
	}
	return false;
}
