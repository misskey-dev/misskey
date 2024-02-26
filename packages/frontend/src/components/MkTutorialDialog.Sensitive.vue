<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.description }}</div>
	<div>{{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.tryThisFile }}</div>
	<MkInfo>{{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.method }}</MkInfo>
	<MkPostForm
		:class="$style.exampleRoot"
		:mock="true"
		:autofocus="false"
		:initialNote="exampleNote"
		@fileChangeSensitive="doSucceeded"
	></MkPostForm>
	<div v-if="onceSucceeded"><b style="color: var(--accent);"><i class="ti ti-check"></i> {{ i18n.ts._initialTutorial.wellDone }}</b> {{ i18n.ts._initialTutorial._howToMakeAttachmentsSensitive.sensitiveSucceeded }}</div>
	<MkFolder>
		<template #label>{{ i18n.ts.previewNoteText }}</template>
		<MkNote :mock="true" :note="exampleNote" :class="$style.exampleRoot"></MkNote>
	</MkFolder>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { ref, reactive } from 'vue';
import { i18n } from '@/i18n.js';
import MkPostForm from '@/components/MkPostForm.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkNote from '@/components/MkNote.vue';
import { $i } from '@/account.js';

const emit = defineEmits<{
	(ev: 'succeeded'): void;
}>();

const onceSucceeded = ref<boolean>(false);

function doSucceeded(fileId: string, to: boolean) {
	if (fileId === exampleNote.fileIds?.[0] && to) {
		onceSucceeded.value = true;
		emit('succeeded');
	}
}

const exampleNote = reactive<Misskey.entities.Note>({
	id: '0000000000',
	createdAt: '2019-04-14T17:30:49.181Z',
	userId: '0000000001',
	user: $i!,
	text: i18n.ts._initialTutorial._howToMakeAttachmentsSensitive._exampleNote.note,
	cw: null,
	visibility: 'public',
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 1,
	reactions: {},
	reactionEmojis: {},
	fileIds: ['0000000002'],
	files: [{
		id: '0000000002',
		createdAt: '2019-04-14T17:30:49.181Z',
		name: 'natto_failed.webp',
		type: 'image/webp',
		md5: 'c44286cf152d0740be0ce5ad45ea85c3',
		size: 827532,
		isSensitive: false,
		blurhash: 'LXNA3TD*XAIA%1%M%gt7.TofRioz',
		properties: {
			width: 256,
			height: 256,
		},
		url: '/client-assets/tutorial/natto_failed.webp',
		thumbnailUrl: '/client-assets/tutorial/natto_failed.webp',
		comment: null,
		folderId: null,
		folder: null,
		userId: null,
		user: null,
	}],
	replyId: null,
	renoteId: null,
});

</script>

<style lang="scss" module>
.exampleRoot {
	border-radius: var(--radius);
	border: var(--panelBorder);
	background: var(--panel);
}

.divider {
	height: 1px;
	background: var(--divider);
}

.image {
	max-width: 300px;
	margin: 0 auto;
}

.post {
	position: relative;
	display: block;
	width: 100%;
	height: 40px;
	color: var(--fgOnAccent);
	font-weight: bold;
	text-align: left;

	&:before {
		content: "";
		display: block;
		width: calc(100% - 38px);
		height: 100%;
		margin: auto;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	}

}

.postIcon {
	position: relative;
	margin-left: 30px;
	margin-right: 8px;
	width: 32px;
}

.postText {
	position: relative;
	line-height: 40px;
}
</style>
