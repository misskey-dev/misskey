import { ComputedRef, inject, isRef, onActivated, onMounted, ref, Ref } from 'vue';

export const setPageMetadata = Symbol('setPageMetadata');

export type PageMetadata = {
	title: string;
	icon: string | null;
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
