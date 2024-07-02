<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkPostForm
			v-if="state === 'writing'"
			fixed
			:instant="true"
			:initialText="initialText"
			:initialVisibility="visibility"
			:initialFiles="files"
			:initialLocalOnly="localOnly"
			:reply="reply"
			:renote="renote"
			:initialVisibleUsers="visibleUsers"
			class="_panel"
			@posted="onPosted"
		/>
		<div v-else-if="state === 'posted'" class="_buttonsCenter">
			<MkButton primary @click="close">{{ i18n.ts.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ i18n.ts.goToMisskey }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// SPECIFICATION: https://misskey-hub.net/docs/for-users/features/share-form/

import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { postMessageToParentWindow } from '@/scripts/post-message.js';
import { i18n } from '@/i18n.js';

const urlParams = new URLSearchParams(window.location.search);
const localOnlyQuery = urlParams.get('localOnly');
const visibilityQuery = urlParams.get('visibility') as typeof Misskey.noteVisibilities[number];

const state = ref<'fetching' | 'writing' | 'posted'>('fetching');
const title = ref(urlParams.get('title'));
const text = urlParams.get('text');
const url = urlParams.get('url');
const initialText = ref<string | undefined>();
const reply = ref<Misskey.entities.Note | undefined>();
const renote = ref<Misskey.entities.Note | undefined>();
const visibility = ref(Misskey.noteVisibilities.includes(visibilityQuery) ? visibilityQuery : undefined);
const localOnly = ref(localOnlyQuery === '0' ? false : localOnlyQuery === '1' ? true : undefined);
const files = ref([] as Misskey.entities.DriveFile[]);
const visibleUsers = ref([] as Misskey.entities.UserDetailed[]);

async function init() {
	let noteText = '';
	if (title.value) noteText += `[ ${title.value} ]\n`;
	// Googleニュース対策
	if (text?.startsWith(`${title.value}.\n`)) noteText += text.replace(`${title.value}.\n`, '');
	else if (text && title.value !== text) noteText += `${text}\n`;
	if (url) {
		try {
			// Normalize the URL to URL-encoded and puny-coded from with the URL constructor.
			//
			// It's common to use unicode characters in the URL for better visibility of URL
			//     like: https://ja.wikipedia.org/wiki/ミスキー
			//  or like: https://藍.moe/
			// However, in the MFM, the unicode characters must be URL-encoded to be parsed as `url` node
			//     like: https://ja.wikipedia.org/wiki/%E3%83%9F%E3%82%B9%E3%82%AD%E3%83%BC
			//  or like: https://xn--931a.moe/
			// Therefore, we need to normalize the URL to URL-encoded form.
			//
			// The URL constructor will parse the URL and normalize unicode characters
			//   in the host to punycode and in the path component to URL-encoded form.
			//   (see url.spec.whatwg.org)
			//
			// In addition, the current MFM renderer decodes the URL-encoded path and / punycode encoded host name so
			//   this normalization doesn't make the visible URL ugly.
			//   (see MkUrl.vue)

			noteText += new URL(url).href;
		} catch {
			// fallback to original URL if the URL is invalid.
			// note that this is extremely rare since the `url` parameter is designed to share a URL and
			// the URL constructor will throw TypeError only if failure, which means the URL is not valid.
			noteText += url;
		}
	}
	initialText.value = noteText.trim();

	if (visibility.value === 'specified') {
		const visibleUserIds = urlParams.get('visibleUserIds');
		const visibleAccts = urlParams.get('visibleAccts');
		await Promise.all(
			[
				...(visibleUserIds ? visibleUserIds.split(',').map(userId => ({ userId })) : []),
				...(visibleAccts ? visibleAccts.split(',').map(Misskey.acct.parse) : []),
			]
			// TypeScriptの指示通りに変換する
				.map(q => 'username' in q ? { username: q.username, host: q.host === null ? undefined : q.host } : q)
				.map(q => misskeyApi('users/show', q)
					.then(user => {
						visibleUsers.value.push(user);
					}, () => {
						console.error(`Invalid user query: ${JSON.stringify(q)}`);
					}),
				),
		);
	}

	try {
		//#region Reply
		const replyId = urlParams.get('replyId');
		const replyUri = urlParams.get('replyUri');
		if (replyId) {
			reply.value = await misskeyApi('notes/show', {
				noteId: replyId,
			});
		} else if (replyUri) {
			const obj = await misskeyApi('ap/show', {
				uri: replyUri,
			});
			if (obj.type === 'Note') {
				reply.value = obj.object;
			}
		}
		//#endregion

		//#region Renote
		const renoteId = urlParams.get('renoteId');
		const renoteUri = urlParams.get('renoteUri');
		if (renoteId) {
			renote.value = await misskeyApi('notes/show', {
				noteId: renoteId,
			});
		} else if (renoteUri) {
			const obj = await misskeyApi('ap/show', {
				uri: renoteUri,
			});
			if (obj.type === 'Note') {
				renote.value = obj.object;
			}
		}
		//#endregion

		//#region Drive files
		const fileIds = urlParams.get('fileIds');
		if (fileIds) {
			await Promise.all(
				fileIds.split(',')
					.map(fileId => misskeyApi('drive/files/show', { fileId })
						.then(file => {
							files.value.push(file);
						}, () => {
							console.error(`Failed to fetch a file ${fileId}`);
						}),
					),
			);
		}
		//#endregion
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: err.message,
			text: err.name,
		});
	}

	state.value = 'writing';
}

init();

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	location.href = '/';
}

function onPosted(): void {
	state.value = 'posted';
	postMessageToParentWindow('misskey:shareForm:shareCompleted');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.share,
	icon: 'ti ti-share',
}));
</script>
