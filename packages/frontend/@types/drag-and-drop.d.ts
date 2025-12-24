/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';
import type { VueDragAndDropData } from '@formkit/drag-and-drop/vue';

type NullableParent = HTMLElement | Ref<HTMLElement | null | undefined> | Readonly<Ref<HTMLElement | null | undefined>>;
type VueDragAndDropDataWithNullableParent<T> = Omit<VueDragAndDropData<T>, 'parent'> & {
	parent: NullableParent;
};

declare module '@formkit/drag-and-drop/vue' {
	/**
	 * Entry point for Vue drag and drop.
	 *
	 * @param data - The drag and drop configuration.
	 *
	 * @returns void
	 */
	function dragAndDrop<T>(data: VueDragAndDropDataWithNullableParent<T> | VueDragAndDropDataWithNullableParent<T>[]): ReturnType<typeof dragAndDrop<T>>;
}

export {};
