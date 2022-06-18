import { ComputedRef, inject, onActivated, onMounted } from 'vue';

export type PageMetadata = {
	title: string;
	icon: string;
	// ...
};

export function definePageMetadata(metadata: PageMetadata | null | ComputedRef<PageMetadata | null>): void {
	const set = inject('setPageMetadata') as null | ((meta: PageMetadata | null | ComputedRef<PageMetadata | null>) => void);
	if (set == null) {
		if (_DEV_) console.error('no setPageMetadata provided');
		return;
	}

	set(metadata);

	onMounted(() => {
		set(metadata);
	});

	onActivated(() => {
		set(metadata);
	});
}
