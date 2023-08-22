<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" @closed="$emit('closed')" @click="onBgClick">
	<div ref="rootEl" :class="$style.root">
		<div :class="$style.header">
			<span :class="$style.icon">
				<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
				<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
				<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
				<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
			</span>
			<Mfm :text="announcement.title"/>
		</div>
		<div :class="$style.content">
			<Mfm :text="announcement.text"/>
			<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
		</div>
		<MkButton :class="$style.gotIt" primary full :disabled="gotItDisabled" @click="gotIt">{{ i18n.ts.gotIt }}<span v-if="secVisible"> ({{ sec }})</span></MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { $i, updateAccount } from '@/account';

const props = withDefaults(defineProps<{
	announcement: misskey.entities.Announcement;
}>(), {
});

const rootEl = shallowRef<HTMLDivElement>();
const modal = shallowRef<InstanceType<typeof MkModal>>();
const gotItDisabled = ref(true);
const secVisible = ref(true);
const sec = ref(props.announcement.closeDuration);

async function gotIt(): Promise<void> {
	if (props.announcement.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts._announcement.readConfirmTitle,
			text: i18n.t('_announcement.readConfirmText', { title: props.announcement.title }),
		});
		if (confirm.canceled) return;
	}

	await os.api('i/read-announcement', { announcementId: props.announcement.id });
	if ($i) {
		updateAccount({
			unreadAnnouncements: $i.unreadAnnouncements.filter((a: { id: string; }) => a.id !== props.announcement.id),
		});
	}
	modal.value?.close();
}

function onBgClick(): void {
	if (sec.value > 0) return;

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

onMounted(() => {
	if (sec.value > 0 ) {
		const waitTimer = setInterval(() => {
			if (sec.value === 0) {
				clearInterval(waitTimer);
				gotItDisabled.value = false;
				secVisible.value = false;
			} else {
				gotItDisabled.value = true;
			}
			sec.value = sec.value - 1;
		}, 1000);
	} else {
		gotItDisabled.value = false;
		secVisible.value = false;
	}
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	background: var(--panel);
	border-radius: var(--radius);
}

.header {
	font-weight: bold;
	font-size: 120%;
}

.icon {
	margin-right: 0.5em;
}

.content {
	margin: 1em 0;
	> img {
		display: block;
		max-height: 300px;
		max-width: 100%;
	}
}
</style>
