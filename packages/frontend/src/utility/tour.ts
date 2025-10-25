/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, shallowRef, watch } from 'vue';
import * as os from '@/os.js';

type TourStep = {
	title: string;
	description: string;
	element: HTMLElement;
};

export async function startTour(steps: TourStep[]) {
	const currentStepIndex = ref(0);
	const titleRef = ref(steps[0].title);
	const descriptionRef = ref(steps[0].description);
	const anchorElementRef = shallowRef<HTMLElement>(steps[0].element);

	watch(currentStepIndex, (newIndex) => {
		const step = steps[newIndex];
		titleRef.value = step.title;
		descriptionRef.value = step.description;
		anchorElementRef.value = step.element;
	});

	const { dispose } = os.popup(await import('@/components/MkSpot.vue').then(x => x.default), {
		title: titleRef,
		description: descriptionRef,
		anchorElement: anchorElementRef,
	}, {
		closed: () => dispose(),
		next: () => {
			currentStepIndex.value++;
		},
		prev: () => {
			currentStepIndex.value--;
		},
	});
}
