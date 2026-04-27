<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" :preferType="'dialog'" @closed="emit('closed')" @click="onBgClick">
	<div ref="rootEl" :class="$style.root">
		<div :class="$style.header">
			<span :class="$style.icon">
				<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
				<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
				<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
				<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
			</span>
			<span :class="$style.title">{{ announcement.title }}</span>
		</div>
		<div :class="$style.text"><Mfm :text="announcement.text"/></div>
		<div ref="bottomEl"></div>
		<div :class="$style.footer">
			<MkButton
				primary
				full
				:disabled="!hasReachedBottom"
				@click="ok"
			>{{ hasReachedBottom ? i18n.ts.close : i18n.ts.scrollToClose }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { updateCurrentAccountPartial } from '@/accounts.js';

const props = defineProps<{
	announcement: Misskey.entities.Announcement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const rootEl = useTemplateRef('rootEl');
const bottomEl = useTemplateRef('bottomEl');
const modal = useTemplateRef('modal');

async function ok() {
	if (props.announcement.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts._announcement.readConfirmTitle,
			text: i18n.tsx._announcement.readConfirmText({ title: props.announcement.title }),
		});
		if (confirm.canceled) return;
	}

	modal.value?.close();
	misskeyApi('i/read-announcement', { announcementId: props.announcement.id });
	updateCurrentAccountPartial({
		unreadAnnouncements: $i!.unreadAnnouncements.filter(a => a.id !== props.announcement.id),
	});
}

function onBgClick() {
	rootEl.value?.animate([{
		offset: 0,
		transform: 'scale(1)',
	}, {
		offset: 0.5,
		transform: 'scale(1.1)',
	}, {
		offset: 1,
		transform: 'scale(1)',
	}], {
		duration: 100,
	});
}

const hasReachedBottom = ref(false);

onMounted(() => {
	if (bottomEl.value && rootEl.value) {
		const bottomElRect = bottomEl.value.getBoundingClientRect();
		const rootElRect = rootEl.value.getBoundingClientRect();
		if (
			bottomElRect.top >= rootElRect.top &&
			bottomElRect.top <= (rootElRect.bottom - 66) // 66 ≒ 75 * 0.9 (modalのアニメーション分)
		) {
			hasReachedBottom.value = true;
			return;
		}

		const observer = new IntersectionObserver(entries => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					hasReachedBottom.value = true;
					observer.disconnect();
				}
			}
		}, {
			root: rootEl.value,
			rootMargin: '0px 0px -75px 0px',
		});

		observer.observe(bottomEl.value);
	}
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px 32px 0;
	min-width: 320px;
	max-width: 480px;
	max-height: 100%;
	overflow-y: auto;
	overflow-x: hidden;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	font-size: 120%;
}

.icon {
	margin-right: 0.5em;
}

.title {
	font-weight: bold;
}

.text {
	margin: 1em 0;
}

.footer {
	position: sticky;
	bottom: 0;
	left: -32px;
	backdrop-filter: var(--MI-blur, blur(15px));
	background: color(from var(--MI_THEME-bg) srgb r g b / 0.5);
	margin: 0 -32px;
	padding: 24px 32px;
}
</style>
