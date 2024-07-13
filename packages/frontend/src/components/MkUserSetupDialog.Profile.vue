<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._initialAccountSetting.theseSettingsCanEditLater }}</MkInfo>

	<FormSlot>
		<template #label>{{ i18n.ts.avatar }}</template>
		<div v-adaptive-bg :class="$style.avatarSection" class="_panel">
			<MkAvatar :class="$style.avatar" :user="$i" @click="setAvatar"/>
			<div style="margin-top: 16px;">
				<MkButton primary rounded inline @click="setAvatar">{{ i18n.ts._profile.changeAvatar }}</MkButton>
			</div>
		</div>
	</FormSlot>

	<MkInput v-model="name" :max="30" manualSave data-cy-user-setup-user-name>
		<template #label>{{ i18n.ts._profile.name }}</template>
	</MkInput>

	<MkTextarea v-model="description" :max="500" tall manualSave data-cy-user-setup-user-description>
		<template #label>{{ i18n.ts._profile.description }}</template>
	</MkTextarea>

	<MkSwitch v-model="useAsBot">
		<template #label>{{ i18n.ts.flagAsBot }}</template>
	</MkSwitch>

	<div v-if="useAsBot" class="_gaps_m">
		<div>
			<MkInfo>{{ i18n.ts._initialAccountSetting.mustBeSetBotOwner }}</MkInfo>
		</div>
		<div>
			<MkButton @click="selectBotOwner">{{ i18n.ts.selectUser }}</MkButton>
			<MkUserCardMini v-if="botOwner" :user="botOwner"></MkUserCardMini>
		</div>
	</div>

	<MkInfo>{{ i18n.ts._initialAccountSetting.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSlot from '@/components/form/slot.vue';
import MkInfo from '@/components/MkInfo.vue';
import { chooseFileFromPc } from '@/scripts/select-file.js';
import * as os from '@/os.js';
import { signinRequired } from '@/account.js';

const $i = signinRequired();

const name = ref($i.name ?? '');
const description = ref($i.description ?? '');
const useAsBot = ref($i.isBot ?? false);
const botOwner = ref<Misskey.entities.UserDetailed | null>(null);

const emit = defineEmits<{
	(ev: 'nextButtonEnabled', value: boolean): void;
}>();

watch(name, () => {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		name: name.value || null,
	});
});

watch(description, () => {
	os.apiWithDialog('i/update', {
		// 空文字列をnullにしたいので??は使うな
		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		description: description.value || null,
	});
});

watch(useAsBot, () => {
	watchBotSettings();
	os.apiWithDialog('i/update', { isBot: useAsBot.value });
});
watch(botOwner, watchBotSettings);

function setAvatar(ev) {
	chooseFileFromPc(false).then(async (files) => {
		const file = files[0];

		let originalOrCropped = file;

		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts.cropImageAsk,
			okText: i18n.ts.cropYes,
			cancelText: i18n.ts.cropNo,
		});

		if (!canceled) {
			originalOrCropped = await os.cropImage(file, {
				aspectRatio: 1,
			});
		}

		const i = await os.apiWithDialog('i/update', {
			avatarId: originalOrCropped.id,
		});
		$i.avatarId = i.avatarId;
		$i.avatarUrl = i.avatarUrl;
	});
}

function selectBotOwner() {
	os.selectUser({ includeSelf: false, localOnly: true }).then(_user => {
		botOwner.value = _user;
	});
}

function watchBotSettings() {
	if (useAsBot.value) {
		if (botOwner.value != null) {
			description.value = (description.value + '\n管理者: @' + botOwner.value.username).trim();
			emit('nextButtonEnabled', true);
		} else {
			emit('nextButtonEnabled', false);
		}
	} else {
		emit('nextButtonEnabled', true);
	}
}
</script>

<style lang="scss" module>
.avatarSection {
	text-align: center;
	padding: 20px;
}

.avatar {
	width: 100px;
	height: 100px;
}
</style>
