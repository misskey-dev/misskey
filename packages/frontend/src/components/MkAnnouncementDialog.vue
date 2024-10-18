<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
		<MkButton :class="$style.gotIt" primary gradate full :disabled="gotItDisabled" @click="gotIt">
			{{ !announcement.needEnrollmentTutorialToRead ? i18n.ts.gotIt : i18n.ts._initialAccountSetting.startTutorial }}
			<span v-if="secVisible"> ({{ sec }})</span>
		</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { $i, updateAccount } from '@/account.js';

const props = withDefaults(defineProps<{
	announcement: Misskey.entities.Announcement;
}>(), {
});

const rootEl = shallowRef<HTMLDivElement>();
const modal = shallowRef<InstanceType<typeof MkModal>>();
const gotItDisabled = ref(true);
const secVisible = ref(true);
const sec = ref(props.announcement.closeDuration);

async function gotIt(): Promise<void> {
	if (props.announcement.needEnrollmentTutorialToRead) {
		modal.value?.close();
		const tutorialCompleted = await (new Promise<boolean>(resolve => {
			os.popup(defineAsyncComponent(() => import('@/components/MkTutorialDialog.vue')), {}, {
				done: () => {
					resolve(true);
				},
			}, 'closed');
		}));
		if (!tutorialCompleted) return;
	}

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
	updateAccount({
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

onMounted(() => {
	if (sec.value > 0) {
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
