<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
		<template #label>{{ i18n.ts._webhookSettings.trigger }}</template>

		<div class="_gaps">
			<div class="_gaps_s">
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_follow">{{ i18n.ts._webhookSettings._events.follow }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_follow)" @click="test('follow')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_followed">{{ i18n.ts._webhookSettings._events.followed }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_followed)" @click="test('followed')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_note">{{ i18n.ts._webhookSettings._events.note }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_note)" @click="test('note')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_reply">{{ i18n.ts._webhookSettings._events.reply }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_reply)" @click="test('reply')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_renote">{{ i18n.ts._webhookSettings._events.renote }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_renote)" @click="test('renote')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_reaction" :disabled="true">{{ i18n.ts._webhookSettings._events.reaction }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_reaction)" @click="test('reaction')"><i class="ti ti-send"></i></MkButton>
				</div>
				<div :class="$style.switchBox">
					<MkSwitch v-model="event_mention">{{ i18n.ts._webhookSettings._events.mention }}</MkSwitch>
					<MkButton transparent :class="$style.testButton" :disabled="!(active && event_mention)" @click="test('mention')"><i class="ti ti-send"></i></MkButton>
				</div>
			</div>

			<div :class="$style.description">
				{{ i18n.ts._webhookSettings.testRemarks }}
			</div>
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
import * as Misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import FormSection from '@/components/form/section.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const props = defineProps<{
	webhookId: string;
}>();

const webhook = await misskeyApi('i/webhooks/show', {
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

function save() {
	const events: Misskey.entities.UserWebhook['on'] = [];
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
		text: i18n.tsx.deleteAreYouSure({ x: webhook.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('i/webhooks/delete', {
		webhookId: props.webhookId,
	});

	router.push('/settings/webhook');
}

async function test(type: Misskey.entities.UserWebhook['on'][number]): Promise<void> {
	await os.apiWithDialog('i/webhooks/test', {
		webhookId: props.webhookId,
		type,
		override: {
			secret: secret.value,
			url: url.value,
		},
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const headerActions = computed(() => []);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: 'Edit webhook',
	icon: 'ti ti-webhook',
}));
</script>

<style module lang="scss">
.switchBox {
	display: flex;
	align-items: center;
	justify-content: start;

	.testButton {
		$buttonSize: 28px;
		padding: 0;
		width: $buttonSize;
		min-width: $buttonSize;
		max-width: $buttonSize;
		height: $buttonSize;
		margin-left: auto;
		line-height: inherit;
		font-size: 90%;
		border-radius: 9999px;
	}
}

.description {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
