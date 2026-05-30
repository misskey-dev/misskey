<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps_m">
			<div class="_gaps_m">
				<MkInput v-model="endpoint" :datalist="endpoints" @update:modelValue="onEndpointChange()">
					<template #label>Endpoint</template>
				</MkInput>
				<MkTextarea v-model="body" code>
					<template #label>Params (JSON or JSON5)</template>
				</MkTextarea>
				<MkSwitch v-model="withCredential">
					With credential
				</MkSwitch>
				<MkButton primary :disabled="sending" @click="send">
					<template v-if="sending"><MkEllipsis/></template>
					<template v-else><i class="ti ti-send"></i> Send</template>
				</MkButton>
			</div>
			<div v-if="res">
				<MkTextarea v-model="res" code readonly tall>
					<template #label>Response</template>
				</MkTextarea>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import JSON5 from 'json5';
import type { Endpoints } from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { definePage } from '@/page.js';

const body = ref('{}');
const endpoint = ref('');
const endpoints = ref<string[]>([]);
const sending = ref(false);
const res = ref('');
const withCredential = ref(true);

misskeyApi('endpoints').then(endpointResponse => {
	endpoints.value = endpointResponse;
});

function send() {
	sending.value = true;
	const requestBody = JSON5.parse(body.value);
	misskeyApi(endpoint.value as keyof Endpoints, requestBody, requestBody.i || (withCredential.value ? undefined : null)).then(resp => {
		sending.value = false;
		res.value = JSON5.stringify(resp, null, 2);
	}, err => {
		sending.value = false;
		res.value = JSON5.stringify(err, null, 2);
	});
}

function onEndpointChange() {
	misskeyApi('endpoint', { endpoint: endpoint.value }, withCredential.value ? undefined : null).then(resp => {
		if (resp == null) {
			body.value = '{}';
			return;
		}

		const endpointBody = {} as Record<string, unknown>;
		for (const p of resp.params) {
			endpointBody[p.name] =
				p.type === 'String' ? '' :
				p.type === 'Number' ? 0 :
				p.type === 'Boolean' ? false :
				p.type === 'Array' ? [] :
				p.type === 'Object' ? {} :
				null;
		}
		body.value = JSON5.stringify(endpointBody, null, 2);
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: 'API console',
	icon: 'ti ti-terminal-2',
}));
</script>
