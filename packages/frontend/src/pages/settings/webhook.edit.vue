<template>
<div class="_gaps_m">
	<FormInput v-model="name">
		<template #label>Name</template>
	</FormInput>

	<FormInput v-model="url" type="url">
		<template #label>URL</template>
	</FormInput>

	<FormInput v-model="secret">
		<template #prefix><i class="ti ti-lock"></i></template>
		<template #label>Secret</template>
	</FormInput>

	<FormSection>
		<template #label>Events</template>

		<div class="_gaps_s">
			<FormSwitch v-model="event_follow">Follow</FormSwitch>
			<FormSwitch v-model="event_followed">Followed</FormSwitch>
			<FormSwitch v-model="event_note">Note</FormSwitch>
			<FormSwitch v-model="event_reply">Reply</FormSwitch>
			<FormSwitch v-model="event_renote">Renote</FormSwitch>
			<FormSwitch v-model="event_reaction">Reaction</FormSwitch>
			<FormSwitch v-model="event_mention">Mention</FormSwitch>
		</div>
	</FormSection>

	<FormSwitch v-model="active">Active</FormSwitch>

	<div class="_buttons">
		<MkButton primary inline @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormInput from '@/components/form/input.vue';
import FormSection from '@/components/form/section.vue';
import FormSwitch from '@/components/form/switch.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	webhookId: string;
}>();

const webhook = await os.api('i/webhooks/show', {
	webhookId: props.webhookId,
});

let name = $ref(webhook.name);
let url = $ref(webhook.url);
let secret = $ref(webhook.secret);
let active = $ref(webhook.active);

let event_follow = $ref(webhook.on.includes('follow'));
let event_followed = $ref(webhook.on.includes('followed'));
let event_note = $ref(webhook.on.includes('note'));
let event_reply = $ref(webhook.on.includes('reply'));
let event_renote = $ref(webhook.on.includes('renote'));
let event_reaction = $ref(webhook.on.includes('reaction'));
let event_mention = $ref(webhook.on.includes('mention'));

async function save(): Promise<void> {
	const events = [];
	if (event_follow) events.push('follow');
	if (event_followed) events.push('followed');
	if (event_note) events.push('note');
	if (event_reply) events.push('reply');
	if (event_renote) events.push('renote');
	if (event_reaction) events.push('reaction');
	if (event_mention) events.push('mention');

	os.apiWithDialog('i/webhooks/update', {
		name,
		url,
		secret,
		webhookId: props.webhookId,
		on: events,
		active,
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'Edit webhook',
	icon: 'ti ti-webhook',
});
</script>
