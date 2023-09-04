/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { ComputedRef, inject, isRef, onActivated, onMounted, provide, ref, Ref } from 'vue';

export const setPageMetadata = Symbol('setPageMetadata');
export const pageMetadataProvider = Symbol('pageMetadataProvider');

export type PageMetadata = {
	title: string;
	subtitle?: string;
	icon?: string | null;
	avatar?: Misskey.entities.User | null;
	userName?: Misskey.entities.User | null;
};

export function definePageMetadata(metadata: PageMetadata | null | Ref<PageMetadata | null> | ComputedRef<PageMetadata | null>): void {
	const _metadata = isRef(metadata) ? metadata : ref(metadata);

	provide(pageMetadataProvider, _metadata);

	const set = inject(setPageMetadata) as any;
	if (set) {
		set(_metadata);

		onMounted(() => {
			set(_metadata);
		});

		onActivated(() => {
			set(_metadata);
		});
	}
}

export function provideMetadataReceiver(callback: (info: ComputedRef<PageMetadata>) => void): void {
	provide(setPageMetadata, callback);
}

export function injectPageMetadata(): PageMetadata | undefined {
	return inject(pageMetadataProvider);
}
