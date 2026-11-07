/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref, shallowRef, watch, defineAsyncComponent } from 'vue';
import * as os from '@/os.js';

type TourStep = {
	title: string;
	description: string;
	element: HTMLElement;
};

export function startTour(steps: TourStep[]) {
	return new Promise<void>((resolve) => {
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

		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkSpot.vue')), {
			title: titleRef,
			description: descriptionRef,
			anchorElement: anchorElementRef,
			hasPrev: computed(() => currentStepIndex.value > 0),
			hasNext: computed(() => currentStepIndex.value < steps.length - 1),
		}, {
			next: () => {
				if (currentStepIndex.value >= steps.length - 1) {
					dispose();
					resolve();
					return;
				}
				currentStepIndex.value++;
			},
			prev: () => {
				currentStepIndex.value--;
			},
		});
	});
}
