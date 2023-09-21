<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<div :class="$style.title">
		<div :class="$style.titleText"><i class="ti ti-info-circle"></i> {{ i18n.ts._timelineTutorial.title }}</div>
		<div :class="$style.step">
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === 0" @click="tutorial--">
				<i class="ti ti-chevron-left"></i>
			</button>
			<span :class="$style.stepNumber">{{ tutorial + 1 }} / {{ tutorialsNumber }}</span>
			<button class="_button" :class="$style.stepArrow" :disabled="tutorial === tutorialsNumber - 1" @click="tutorial++">
				<i class="ti ti-chevron-right"></i>
			</button>
		</div>
	</div>

	<div v-if="tutorial === 0" :class="$style.body">
		<div>{{ i18n.t('_timelineTutorial.step1_1', { name: instance.name ?? host }) }}</div>
		<div>{{ i18n.t('_timelineTutorial.step1_2', { name: instance.name ?? host }) }}</div>
	</div>
	<div v-else-if="tutorial === 1" :class="$style.body">
		<div>{{ i18n.ts._timelineTutorial.step2_1 }}</div>
		<div>{{ i18n.t('_timelineTutorial.step2_2', { name: instance.name ?? host }) }}</div>
	</div>
	<div v-else-if="tutorial === 2" :class="$style.body">
		<div>{{ i18n.ts._timelineTutorial.step3_1 }}</div>
		<div>{{ i18n.ts._timelineTutorial.step3_2 }}</div>
	</div>
	<div v-else-if="tutorial === 3" :class="$style.body">
		<div>{{ i18n.ts._timelineTutorial.step4_1 }}</div>
		<div>{{ i18n.ts._timelineTutorial.step4_2 }}</div>
	</div>

	<div :class="$style.footer">
		<template v-if="tutorial === tutorialsNumber - 1">
			<MkButton :class="$style.footerItem" primary rounded gradate @click="tutorial = -1">{{ i18n.ts.done }} <i class="ti ti-check"></i></MkButton>
		</template>
		<template v-else>
			<MkButton :class="$style.footerItem" primary rounded gradate @click="tutorial++">{{ i18n.ts.next }} <i class="ti ti-arrow-right"></i></MkButton>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { host } from '@/config.js';

const tutorialsNumber = 4;

const tutorial = computed({
	get() { return defaultStore.reactiveState.timelineTutorial.value || 0; },
	set(value) { defaultStore.set('timelineTutorial', value); },
});
</script>

<style lang="scss" module>
.small {
	opacity: 0.7;
}

.container {
	border: solid 2px var(--accent);
}

.title {
	display: flex;
	flex-wrap: wrap;
	padding: 22px 32px;
	font-weight: bold;

	&Text {
		margin: 4px 0;
		padding-right: 4px;
	}
}

.step {
	margin-left: auto;

	&Arrow {
		padding: 4px;
		&:disabled {
			opacity: 0.5;
		}
		&:first-child {
			padding-right: 8px;
		}
		&:last-child {
			padding-left: 8px;
		}
	}

	&Number {
		font-weight: normal;
		margin: 4px;
	}
}

.body {
	padding: 0 32px;
}

.footer {
	display: flex;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: right;
	padding: 22px 32px;

	&Item {
		margin: 4px;
	}
}
</style>
