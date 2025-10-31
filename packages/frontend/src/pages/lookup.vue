<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div v-if="state === 'done'" class="_buttonsCenter">
			<MkButton @click="close">{{ i18n.ts.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ i18n.ts.goToMisskey }}</MkButton>
		</div>
		<div v-else class="_fullInfo">
			<MkLoading/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { mainRouter } from '@/router.js';
import MkButton from '@/components/MkButton.vue';

const state = ref<'fetching' | 'done'>('fetching');

function _fetch_() {
	const params = new URL(window.location.href).searchParams;

	// acctのほうはdeprecated
	let uri = params.get('uri') ?? params.get('acct');
	if (uri == null) {
		state.value = 'done';
		return;
	}

	let promise: Promise<unknown>;

	if (uri.startsWith('https://')) {
		promise = misskeyApi('ap/show', {
			uri,
		}).then(res => {
			if (res.type === 'User') {
				mainRouter.replace('/@:acct/:page?', {
					params: {
						acct: res.object.host != null ? `${res.object.username}@${res.object.host}` : res.object.username,
					},
				});
			} else if (res.type === 'Note') {
				mainRouter.replace('/notes/:noteId/:initialTab?', {
					params: {
						noteId: res.object.id,
					},
				});
			} else {
				os.alert({
					type: 'error',
					text: 'Not a user',
				});
			}
		});
	} else {
		if (uri.startsWith('acct:')) {
			uri = uri.slice(5);
		}
		promise = misskeyApi('users/show', Misskey.acct.parse(uri)).then(user => {
			mainRouter.replace('/@:acct/:page?', {
				params: {
					acct: user.host != null ? `${user.username}@${user.host}` : user.username,
				},
			});
		});
	}

	os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
}

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		window.location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	window.location.href = '/';
}

_fetch_();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage({
	title: i18n.ts.lookup,
	icon: 'ti ti-world-search',
});
</script>
