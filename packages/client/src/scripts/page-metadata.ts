import * as misskey from 'misskey-js';
import { ComputedRef, inject, isRef, onActivated, onMounted, provide, ref, Ref } from 'vue';

export const setPageMetadata = Symbol('setPageMetadata');

export type PageMetadata = {
	title: string;
	subtitle?: string;
	icon?: string | null;
	avatar?: misskey.entities.User | null;
	userName?: misskey.entities.User | null;
	tabs?: {
		title: string;
		active: boolean;
		icon?: string;
		iconOnly?: boolean;
		onClick: () => void;
	}[];
	// ...
};

export function definePageMetadata(metadata: PageMetadata | null | Ref<PageMetadata | null> | ComputedRef<PageMetadata | null>): void {
	const _metadata = isRef(metadata) ? metadata : { value: metadata };
	const set = inject(setPageMetadata) as any;
	if (set == null) {
		if (_DEV_) console.error('no setPageMetadata provided');
		return;
	}

	set(_metadata);

	onMounted(() => {
		set(_metadata);
	});

	onActivated(() => {
		set(_metadata);
	});
}

export function provideMetadataReceiver(callback: (info: ComputedRef<PageMetadata>) => void): void {
	provide(setPageMetadata, callback);
}
