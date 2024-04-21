<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="false"
	:okButtonDisabled="false"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? i18n.ts._abuseReport._notificationRecipient.createRecipient : i18n.ts._abuseReport._notificationRecipient.modifyRecipient }}
	</template>
	<div v-if="loading === 0">
		<MkSpacer :marginMin="20" :marginMax="28">
			<div :class="$style.root" class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ i18n.ts.title }}</template>
				</MkInput>
				<MkSelect v-model="method">
					<template #label>{{ i18n.ts._abuseReport._notificationRecipient.recipientType }}</template>
					<option value="email">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.mail }}</option>
					<option value="webhook">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.webhook }}</option>
				</MkSelect>
				<div>
					<MkSelect v-if="method === 'email'" v-model="userId">
						<template #label>{{ i18n.ts._abuseReport._notificationRecipient.notifiedUser }}</template>
						<option v-for="user in moderators" :key="user.id" :value="user.id">
							{{ user.name ? `${user.name}(${user.username})` : user.username }}
						</option>
					</MkSelect>
					<div v-else-if="method === 'webhook'" :class="$style.systemWebhook">
						<MkSelect v-model="systemWebhookId" style="flex: 1">
							<template #label>{{ i18n.ts._abuseReport._notificationRecipient.notifiedWebhook }}</template>
							<option v-for="webhook in abuseReportWebhooks" :key="webhook.id" :value="webhook.id">
								{{ webhook.name }}
							</option>
						</MkSelect>
						<MkButton rounded @click="onCreateSystemWebhookClicked">
							<i class="ti ti-plus"></i>
						</MkButton>
					</div>
				</div>

				<MkDivider/>

				<MkSwitch v-model="isActive">
					<template #label>{{ i18n.ts._abuseReport._notificationRecipient.active }}</template>
				</MkSwitch>
			</div>
		</MkSpacer>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton primary @click="onSubmitClicked"><i class="ti ti-check"></i> {{ i18n.ts.ok }}</MkButton>
			<MkButton @click="onCancelClicked"><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref, toRefs } from 'vue';
import { entities } from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkSelect from '@/components/MkSelect.vue';
import { showSystemWebhookEditorDialog } from '@/components/MkSystemWebhookEditor.impl.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkDivider from '@/components/MkDivider.vue';
import * as os from '@/os.js';

type NotificationRecipientMethod = 'email' | 'webhook';

const emit = defineEmits<{
	(ev: 'submitted'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	mode: 'create' | 'edit';
	id?: string;
}>();

const { mode, id } = toRefs(props);

const loading = ref<number>(0);

const title = ref<string>('');
const method = ref<NotificationRecipientMethod>('email');
const userId = ref<string | null>(null);
const systemWebhookId = ref<string | null>(null);
const isActive = ref<boolean>(true);

const moderators = ref<entities.User[]>([]);
const abuseReportWebhooks = ref<(entities.SystemWebhook)[]>([]);

async function onSubmitClicked() {
	await loadingScope(async () => {
		const _userId = (method.value === 'email') ? userId.value : null;
		const _systemWebhookId = (method.value === 'webhook') ? systemWebhookId.value : null;
		const params = {
			isActive: isActive.value,
			name: title.value,
			method: method.value,
			userId: _userId ?? undefined,
			systemWebhookId: _systemWebhookId ?? undefined,
		};

		try {
			switch (mode.value) {
				case 'create': {
					await misskeyApi('admin/abuse-report/notification-recipient/create', { items: [params] });
					break;
				}
				case 'edit': {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					await misskeyApi('admin/abuse-report/notification-recipient/update', { items: [{ id: id.value!, ...params }] });
					break;
				}
			}

			emit('submitted');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (ex: any) {
			console.error(ex);
			await os.alert({
				type: 'error',
				title: i18n.ts.error,
				text: ex?.message ?? i18n.ts.internalServerErrorDescription,
			});
		}
	});
}

function onCancelClicked() {
	emit('closed');
}

async function onCreateSystemWebhookClicked() {
	const result = await showSystemWebhookEditorDialog({
		mode: 'create',
		requiredEvents: ['abuseReport'],
	});
	if (!result) {
		return;
	}

	await fetchAbuseReportWebhooks();
	systemWebhookId.value = result.id ?? null;
}

async function fetchAbuseReportWebhooks() {
	await loadingScope(async () => {
		abuseReportWebhooks.value = await misskeyApi('admin/system-webhook/list', {
			isActive: true,
			type: ['abuseReport'],
		});
	});
}

async function fetchModerators() {
	await loadingScope(async () => {
		const users = Array.of<entities.User>();
		for (; ;) {
			const res = await misskeyApi('admin/show-users', {
				limit: 100,
				state: 'adminOrModerator',
				origin: 'local',
				offset: users.length,
			});

			if (res.length === 0) {
				break;
			}

			users.push(...res);
		}

		moderators.value = users;
	});
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
		await fetchModerators();
		await fetchAbuseReportWebhooks();

		if (mode.value === 'edit') {
			if (!id.value) {
				throw new Error('id is required');
			}

			const res = await misskeyApi('admin/abuse-report/notification-recipient/show', { id: id.value });

			title.value = res.name;
			method.value = res.method;
			userId.value = res.userId ?? null;
			systemWebhookId.value = res.systemWebhookId ?? null;
			isActive.value = res.isActive;
		} else {
			userId.value = moderators.value[0]?.id ?? null;
			systemWebhookId.value = abuseReportWebhooks.value[0]?.id ?? null;
		}
	});
});

</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: stretch;
}

.footer {
	display: flex;
	justify-content: center;
	align-items: flex-end;
	margin-top: 20px;
}

.systemWebhook {
	display: flex;
	flex-direction: row;
	justify-content: stretch;
	align-items: flex-end;
	gap: 8px;

	button {
		width: 2.5em;
		height: 2.5em;
		min-width: 2.5em;
		min-height: 2.5em;
		box-sizing: border-box;
		padding: 6px;
	}
}
</style>
