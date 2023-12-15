<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center; padding: 0 16px;">{{ i18n.ts._initialTutorial._postNote.description1 }}</div>
	<MkPostForm :class="$style.exampleRoot" :mock="true" :autofocus="false"/>
	<MkFormSection>
		<template #label>{{ i18n.ts.visibility }}</template>
		<div class="_gaps">
			<div>{{ i18n.ts._initialTutorial._postNote._visibility.description }}</div>
			<div><i class="ti ti-world"></i> <b>{{ i18n.ts._visibility.public }}</b> … {{ i18n.ts._initialTutorial._postNote._visibility.public }}</div>
			<div><i class="ti ti-home"></i> <b>{{ i18n.ts._visibility.home }}</b> … {{ i18n.ts._initialTutorial._postNote._visibility.home }}</div>
			<div><i class="ti ti-lock"></i> <b>{{ i18n.ts._visibility.followers }}</b> … {{ i18n.ts._initialTutorial._postNote._visibility.followers }}</div>
			<div class="_gaps_s">
				<div><i class="ti ti-mail"></i> <b>{{ i18n.ts._visibility.specified }}</b> … {{ i18n.ts._initialTutorial._postNote._visibility.direct }}</div>
				<MkInfo :warn="true">
					<b>{{ i18n.ts._initialTutorial._postNote._visibility.doNotSendConfidencialOnDirect1 }}</b> {{ i18n.ts._initialTutorial._postNote._visibility.doNotSendConfidencialOnDirect2 }}
				</MkInfo>
			</div>
			<div><i class="ti ti-rocket-off"></i> <b>{{ i18n.ts._visibility.disableFederation }}</b> … {{ i18n.ts._initialTutorial._postNote._visibility.localOnly }}</div>
		</div>
	</MkFormSection>
	<MkFormSection>
		<template #label>{{ i18n.ts._initialTutorial._postNote._cw.title }}</template>
		<div class="_gaps">
			<div>{{ i18n.ts._initialTutorial._postNote._cw.description }}</div>
			<MkNote :class="$style.exampleRoot" :note="exampleCWNote" :mock="true"/>
			<div>{{ i18n.ts._initialTutorial._postNote._cw.useCases }}</div>
		</div>
	</MkFormSection>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { reactive } from 'vue';
import { i18n } from '@/i18n.js';
import MkNote from '@/components/MkNote.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkFormSection from '@/components/form/section.vue';
import MkInfo from '@/components/MkInfo.vue';

const exampleCWNote = reactive<Misskey.entities.Note>({
	id: '0000000000',
	createdAt: '2019-04-14T17:30:49.181Z',
	userId: '0000000001',
	user: {
		id: '0000000001',
		name: '藍',
		username: 'ai',
		host: null,
		avatarDecorations: [],
		avatarUrl: '/client-assets/tutorial/ai.webp',
		avatarBlurhash: 'eiKmhHIByXxZ~qWXs:-pR*NbR*s:xuRjoL-oR*WCt6WWf6WVf6oeWB',
		isBot: false,
		isCat: true,
		emojis: {},
		onlineStatus: null,
		badgeRoles: [],
	},
	text: i18n.ts._initialTutorial._postNote._cw._exampleNote.note,
	cw: i18n.ts._initialTutorial._postNote._cw._exampleNote.cw,
	visibility: 'public',
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 1,
	reactions: {},
	reactionEmojis: {},
	fileIds: [],
	files: [],
	replyId: null,
	renoteId: null,
});
</script>

<style lang="scss" module>
.exampleRoot {
	max-width: none!important;
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
