<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="600"
	:height="650"
	@close="close(true)"
	@closed="emit('closed')"
>
	<template v-if="page === 1" #header><i class="ti ti-pencil"></i> {{ i18n.ts._initialTutorial._note.title }}</template>
	<template v-else-if="page === 2" #header><i class="ti ti-mood-smile"></i> {{ i18n.ts._initialTutorial._reaction.title }}</template>
	<template v-else-if="page === 3" #header><i class="ti ti-home"></i> {{ i18n.ts._initialTutorial._timeline.title }}</template>
	<template v-else-if="page === 5" #header><i class="ti ti-pencil-plus"></i> {{ i18n.ts._initialTutorial._postNote.title }}</template>
	<template v-else-if="page === 6" #header><i class="ti ti-eye-exclamation"></i> {{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.title }}</template>
	<template v-else #header>{{ i18n.ts._initialTutorial.title }}</template>

	<XTutorial
		:initialPage="initialPage"
		:skippable="true"
		@pageChanged="handlePageChange"
		@close="close"
	/>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import XTutorial from '@/components/MkTutorial.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

const props = defineProps<{
	initialPage?: number;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

// eslint-disable-next-line vue/no-setup-props-destructure
const page = ref(props.initialPage ?? 0);

function handlePageChange(to: number) {
	page.value = to;
}

async function close(skip?: boolean) {
	if (skip) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts._initialTutorial.skipAreYouSure,
		});
		if (canceled) return;
	}

	dialog.value?.close();
}
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100cqh;
	padding-bottom: 30px;
	box-sizing: border-box;
}

.pageRoot {
	display: flex;
	flex-direction: column;
	min-height: 100%;
}

.pageMain {
	flex-grow: 1;
	line-height: 1.5;
}

.pageFooter {
	position: sticky;
	bottom: 0;
	left: 0;
	flex-shrink: 0;
	padding: 12px;
	border-top: solid 0.5px var(--divider);
	-webkit-backdrop-filter: blur(15px);
	backdrop-filter: blur(15px);
}
</style>
