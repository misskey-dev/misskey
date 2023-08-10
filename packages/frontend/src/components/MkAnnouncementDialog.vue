<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" @closed="$emit('closed')">
	<div :class="$style.root">
		<div :class="$style.title">{{ announcement.title }}</div>
		<div :class="$style.text">{{ announcement.text }}</div>
		<MkButton primary full @click="ok">{{ i18n.ts.ok }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, shallowRef } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	announcement: misskey.entities.Announcement;
}>(), {
});

const modal = shallowRef<InstanceType<typeof MkModal>>();

function ok() {
	modal.value.close();
	os.api('i/read-announcement', { announcementId: props.announcement.id });
}

onMounted(() => {
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
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.title {
	font-weight: bold;
}

.text {
	margin: 1em 0;
}
</style>
