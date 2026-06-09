<!--
SPDX-FileCopyrightText: Rickskey Project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { _panel: !widgetProps.transparent }]">
	<div v-if="loading" :class="$style.loading">
		<MkLoading mini/>
	</div>
	<div v-else-if="prompt == null" :class="$style.empty">
		{{ i18n.ts._dailyPrompt.noPromptToday }}
	</div>
	<div v-else :class="$style.content">
		<div :class="$style.header">
			<i class="ti ti-bulb" :class="$style.icon"></i>
			<span :class="$style.label">{{ i18n.ts.dailyPrompt }}</span>
			<span v-if="prompt.deadline" :class="$style.deadline">
				〜{{ new Date(prompt.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
			</span>
		</div>
		<div :class="$style.title">{{ prompt.title }}</div>
		<div v-if="prompt.description" :class="$style.desc">{{ prompt.description }}</div>
		<div :class="$style.footer">
			<span :class="$style.participants">
				<i class="ti ti-users"></i>
				{{ i18n.tsx._dailyPrompt.participants({ n: prompt.participantCount }) }}
			</span>
			<MkButton small primary @click="joinPrompt">
				#{{ prompt.hashtag }}
			</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useWidgetPropsManager, type Widget, type WidgetComponentEmits, type WidgetComponentExpose, type WidgetComponentProps } from './widget.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { useRouter } from '@/router/supplier.js';
import MkButton from '@/components/MkButton.vue';
import MkLoading from '@/pages/_loading_.vue';

const props = defineProps<WidgetComponentProps<Record<string, never>>>();
const emit = defineEmits<WidgetComponentEmits<Record<string, never>>>();

const router = useRouter();

const widgetPropsDef = {};
const { widgetProps, configure } = useWidgetPropsManager(
	'dailyPrompt',
	widgetPropsDef,
	props,
	emit,
);

type Prompt = {
	id: string;
	title: string;
	description: string | null;
	hashtag: string;
	deadline: string | null;
	participantCount: number;
};

const loading = ref(true);
const prompt = ref<Prompt | null>(null);

async function load() {
	loading.value = true;
	try {
		prompt.value = await misskeyApi('daily-prompt', {}) as Prompt | null;
	} catch {
		prompt.value = null;
	} finally {
		loading.value = false;
	}
}

function joinPrompt() {
	if (!prompt.value) return;
	router.push(`/search?query=%23${encodeURIComponent(prompt.value.hashtag)}`);
}

onMounted(load);

defineExpose<WidgetComponentExpose>({ configure });
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}

.loading {
	display: flex;
	justify-content: center;
	padding: 8px;
}

.empty {
	font-size: 0.9em;
	color: var(--MI_THEME-fgTransparent);
	text-align: center;
	padding: 8px 0;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.header {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 0.8em;
	color: var(--MI_THEME-fgTransparent);
}

.icon {
	color: var(--MI_THEME-accent);
}

.label {
	font-weight: bold;
	color: var(--MI_THEME-accent);
}

.deadline {
	margin-left: auto;
}

.title {
	font-size: 1.1em;
	font-weight: bold;
	line-height: 1.4;
}

.desc {
	font-size: 0.9em;
	color: var(--MI_THEME-fgTransparent);
}

.footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 4px;
}

.participants {
	font-size: 0.85em;
	color: var(--MI_THEME-fgTransparent);
}
</style>
