<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="modal"
	:preferType="'dialog'"
	@click="modal?.close()"
	@closed="onModalClosed()"
	@esc="modal?.close()"
>
	<MkPostForm
		ref="form"
		:class="$style.form"
		v-bind="props"
		autofocus
		freezeAfterPosted
		@posting="onPosting"
		@postError="onPostError"
		@cancel="modal?.close()"
		@esc="modal?.close()"
	/>
</MkModal>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue';
import type { PostFormProps } from '@/types/post-form.js';
import MkModal from '@/components/MkModal.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import * as os from '@/os.js';

const props = withDefaults(defineProps<PostFormProps & {
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
}>(), {
	initialLocalOnly: undefined,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');

function onPosting() {
	modal.value?.close({
		useSendAnimation: true,
	});
}

function onPostError() {
	os.post();
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
