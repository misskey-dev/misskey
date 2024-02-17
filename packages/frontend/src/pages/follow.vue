<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';
import { mainRouter } from '@/router/main.js';

async function follow(user): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.tsx.followConfirm({ name: user.name || user.username }),
	});

	if (canceled) {
		window.close();
		return;
	}

	os.apiWithDialog('following/create', {
		userId: user.id,
		withReplies: defaultStore.state.defaultWithReplies,
	});
	user.withReplies = defaultStore.state.defaultWithReplies;
}

const acct = new URL(location.href).searchParams.get('acct');
if (acct == null) {
	throw new Error('acct required');
}

let promise;

if (acct.startsWith('https://')) {
	promise = misskeyApi('ap/show', {
		uri: acct,
	});
	promise.then(res => {
		if (res.type === 'User') {
			follow(res.object);
		} else if (res.type === 'Note') {
			mainRouter.push(`/notes/${res.object.id}`);
		} else {
			os.alert({
				type: 'error',
				text: 'Not a user',
			}).then(() => {
				window.close();
			});
		}
	});
} else {
	promise = misskeyApi('users/show', Misskey.acct.parse(acct));
	promise.then(user => {
		follow(user);
	});
}

os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
</script>
