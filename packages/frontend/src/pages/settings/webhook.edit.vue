<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="name">
		<template #label>{{ i18n.ts._webhookSettings.name }}</template>
	</MkInput>

	<MkInput v-model="url" type="url">
		<template #label>URL</template>
	</MkInput>

	<MkInput v-model="secret">
		<template #prefix><i class="ti ti-lock"></i></template>
		<template #label>{{ i18n.ts._webhookSettings.secret }}</template>
	</MkInput>

	<FormSection>
		<template #label>{{ i18n.ts._webhookSettings.events }}</template>

		<div class="_gaps_s">
			<MkSwitch v-model="event_follow">{{ i18n.ts._webhookSettings._events.follow }}</MkSwitch>
			<MkSwitch v-model="event_followed">{{ i18n.ts._webhookSettings._events.followed }}</MkSwitch>
			<MkSwitch v-model="event_note">{{ i18n.ts._webhookSettings._events.note }}</MkSwitch>
			<MkSwitch v-model="event_reply">{{ i18n.ts._webhookSettings._events.reply }}</MkSwitch>
			<MkSwitch v-model="event_renote">{{ i18n.ts._webhookSettings._events.renote }}</MkSwitch>
			<MkSwitch v-model="event_reaction">{{ i18n.ts._webhookSettings._events.reaction }}</MkSwitch>
			<MkSwitch v-model="event_mention">{{ i18n.ts._webhookSettings._events.mention }}</MkSwitch>
		</div>
	</FormSection>

	<MkSwitch v-model="active">{{ i18n.ts._webhookSettings.active }}</MkSwitch>

	<div class="_buttons">
		<MkButton primary inline @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
		<MkButton danger inline @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkInput from '@/components/MkInput.vue';
import FormSection from '@/components/form/section.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const props = defineProps<{
	webhookId: string;
}>();

const webhook = await os.api('i/webhooks/show', {
	webhookId: props.webhookId,
});

const name = ref(webhook.name);
const url = ref(webhook.url);
const secret = ref(webhook.secret);
const active = ref(webhook.active);

const event_follow = ref(webhook.on.includes('follow'));
const event_followed = ref(webhook.on.includes('followed'));
const event_note = ref(webhook.on.includes('note'));
const event_reply = ref(webhook.on.includes('reply'));
const event_renote = ref(webhook.on.includes('renote'));
const event_reaction = ref(webhook.on.includes('reaction'));
const event_mention = ref(webhook.on.includes('mention'));

async function save(): Promise<void> {
	const events = [];
	if (event_follow.value) events.push('follow');
	if (event_followed.value) events.push('followed');
	if (event_note.value) events.push('note');
	if (event_reply.value) events.push('reply');
	if (event_renote.value) events.push('renote');
	if (event_reaction.value) events.push('reaction');
	if (event_mention.value) events.push('mention');

	os.apiWithDialog('i/webhooks/update', {
		name: name.value,
		url: url.value,
		secret: secret.value,
		webhookId: props.webhookId,
		on: events,
		active: active.value,
	});
}

async function del(): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: webhook.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('i/webhooks/delete', {
		webhookId: props.webhookId,
	});

	router.push('/settings/webhook');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: 'Edit webhook',
	icon: 'ti ti-webhook',
});
</script>
