<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" @click="modal?.close()" @closed="onModalClosed()">
	<MkPostForm ref="form" :class="$style.form" v-bind="props" autofocus freezeAfterPosted @posted="onPosted" @cancel="modal?.close()" @esc="modal?.close()"/>
</MkModal>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import MkPostForm from '@/components/MkPostForm.vue';

const props = withDefaults(defineProps<{
	reply?: Misskey.entities.Note;
	renote?: Misskey.entities.Note;
	channel?: any; // TODO
	mention?: Misskey.entities.User;
	specified?: Misskey.entities.UserDetailed;
	initialText?: string;
	initialCw?: string;
	initialVisibility?: (typeof Misskey.noteVisibilities)[number];
	initialFiles?: Misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: Misskey.entities.UserDetailed[];
	initialNote?: Misskey.entities.Note;
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
}>(), {
	initialLocalOnly: undefined,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const form = shallowRef<InstanceType<typeof MkPostForm>>();

function onPosted() {
	modal.value?.close({
		useSendAnimation: true,
	});
}

function onModalClosed() {
	emit('closed');
}
</script>

<style lang="scss" module>
.form {
	max-height: 100%;
	margin: 0 auto auto auto;
}
</style>
