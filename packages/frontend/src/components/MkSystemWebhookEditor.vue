<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="450"
	:height="590"
	:canClose="true"
	:withOkButton="false"
	:okButtonDisabled="false"
	@click="onCancelClicked"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? i18n.ts._webhookSettings.createWebhook : i18n.ts._webhookSettings.modifyWebhook }}
	</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<MkLoading v-if="loading !== 0"/>
		<div v-else :class="$style.root" class="_gaps_m">
			<MkInput v-model="title">
				<template #label>{{ i18n.ts._webhookSettings.name }}</template>
			</MkInput>
			<MkInput v-model="url">
				<template #label>URL</template>
			</MkInput>
			<MkInput v-model="secret">
				<template #label>{{ i18n.ts._webhookSettings.secret }}</template>
			</MkInput>
			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts._webhookSettings.events }}</template>

				<div class="_gaps_s">
					<MkSwitch v-model="events.abuseReport" :disabled="disabledEvents.abuseReport">
						<template #label>{{ i18n.ts._webhookSettings._systemEvents.abuseReport }}</template>
					</MkSwitch>
					<MkSwitch v-model="events.abuseReportResolved" :disabled="disabledEvents.abuseReportResolved">
						<template #label>{{ i18n.ts._webhookSettings._systemEvents.abuseReportResolved }}</template>
					</MkSwitch>
				</div>
			</MkFolder>

			<MkSwitch v-model="isActive">
				<template #label>{{ i18n.ts.enable }}</template>
			</MkSwitch>

			<div :class="$style.footer" class="_buttonsCenter">
				<MkButton primary :disabled="disableSubmitButton" @click="onSubmitClicked">
					<i class="ti ti-check"></i>
					{{ i18n.ts.ok }}
				</MkButton>
				<MkButton @click="onCancelClicked"><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, toRefs } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import {
	MkSystemWebhookEditorProps,
	MkSystemWebhookResult,
	SystemWebhookEventType,
} from '@/components/MkSystemWebhookEditor.impl.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';

type EventType = {
	abuseReport: boolean;
	abuseReportResolved: boolean;
}

const emit = defineEmits<{
	(ev: 'submitted', result: MkSystemWebhookResult): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

const props = defineProps<MkSystemWebhookEditorProps>();

const { mode, id, requiredEvents } = toRefs(props);

const loading = ref<number>(0);

const title = ref<string>('');
const url = ref<string>('');
const secret = ref<string>('');
const events = ref<EventType>({
	abuseReport: true,
	abuseReportResolved: true,
});
const isActive = ref<boolean>(true);

const disabledEvents = ref<EventType>({
	abuseReport: false,
	abuseReportResolved: false,
});

const disableSubmitButton = computed(() => {
	if (!title.value) {
		return true;
	}
	if (!url.value) {
		return true;
	}
	if (!secret.value) {
		return true;
	}

	return false;
});

async function onSubmitClicked() {
	await loadingScope(async () => {
		const params = {
			isActive: isActive.value,
			name: title.value,
			url: url.value,
			secret: secret.value,
			on: Object.keys(events.value).filter(ev => events.value[ev as keyof EventType]) as SystemWebhookEventType[],
		};

		try {
			switch (mode.value) {
				case 'create': {
					const result = await misskeyApi('admin/system-webhook/create', params);
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
				case 'edit': {
					// eslint-disable-next-line
					const result = await misskeyApi('admin/system-webhook/update', { id: id.value!, ...params });
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
			}
			// eslint-disable-next-line
		} catch (ex: any) {
			const msg = ex.message ?? i18n.ts.internalServerErrorDescription;
			await os.alert({ type: 'error', title: i18n.ts.error, text: msg });
			dialogEl.value?.close();
			emit('canceled');
		}
	});
}

function onCancelClicked() {
	dialogEl.value?.close();
	emit('canceled');
}

async function loadingScope<T>(fn: () => Promise<T>): Promise<T> {
	loading.value++;
	try {
		return await fn();
	} finally {
		loading.value--;
	}
}

onMounted(async () => {
	await loadingScope(async () => {
		switch (mode.value) {
			case 'edit': {
				if (!id.value) {
					throw new Error('id is required');
				}

				try {
					const res = await misskeyApi('admin/system-webhook/show', { id: id.value });

					title.value = res.name;
					url.value = res.url;
					secret.value = res.secret;
					isActive.value = res.isActive;
					for (const ev of Object.keys(events.value)) {
						events.value[ev] = res.on.includes(ev as SystemWebhookEventType);
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (ex: any) {
					const msg = ex.message ?? i18n.ts.internalServerErrorDescription;
					await os.alert({ type: 'error', title: i18n.ts.error, text: msg });
					dialogEl.value?.close();
					emit('canceled');
				}
				break;
			}
		}

		for (const ev of requiredEvents.value ?? []) {
			disabledEvents.value[ev] = true;
		}
	});
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: stretch;
}

.footer {
	display: flex;
	justify-content: center;
	align-items: flex-end;
	margin-top: 20px;
}
</style>
