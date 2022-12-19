<template>
<div class="_formRoot">
	<FormInput v-model="name" class="_formBlock">
		<template #label>Name</template>
	</FormInput>

	<FormInput v-model="url" type="url" class="_formBlock">
		<template #label>URL</template>
	</FormInput>

	<FormInput v-model="secret" class="_formBlock">
		<template #prefix><i class="fas fa-lock"></i></template>
		<template #label>Secret</template>
	</FormInput>

	<FormSection>
		<template #label>Events</template>

		<FormSwitch v-model="event_follow" class="_formBlock">Follow</FormSwitch>
		<FormSwitch v-model="event_followed" class="_formBlock">Followed</FormSwitch>
		<FormSwitch v-model="event_note" class="_formBlock">Note</FormSwitch>
		<FormSwitch v-model="event_reply" class="_formBlock">Reply</FormSwitch>
		<FormSwitch v-model="event_renote" class="_formBlock">Renote</FormSwitch>
		<FormSwitch v-model="event_reaction" class="_formBlock">Reaction</FormSwitch>
		<FormSwitch v-model="event_mention" class="_formBlock">Mention</FormSwitch>
	</FormSection>

	<div class="_formBlock" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
		<FormButton primary inline @click="create"><i class="fas fa-check"></i> {{ i18n.ts.create }}</FormButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import FormInput from '@/components/form/input.vue';
import FormSection from '@/components/form/section.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let name = $ref('');
let url = $ref('');
let secret = $ref('');

let event_follow = $ref(true);
let event_followed = $ref(true);
let event_note = $ref(true);
let event_reply = $ref(true);
let event_renote = $ref(true);
let event_reaction = $ref(true);
let event_mention = $ref(true);

async function create(): Promise<void> {
	const events = [];
	if (event_follow) events.push('follow');
	if (event_followed) events.push('followed');
	if (event_note) events.push('note');
	if (event_reply) events.push('reply');
	if (event_renote) events.push('renote');
	if (event_reaction) events.push('reaction');
	if (event_mention) events.push('mention');

	os.apiWithDialog('i/webhooks/create', {
		name,
		url,
		secret,
		on: events,
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'Create new webhook',
	icon: 'fas fa-bolt',
});
</script>
