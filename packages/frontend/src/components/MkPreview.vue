<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.preview">
	<div>
		<MkInput v-model="text">
			<template #label>Text</template>
		</MkInput>
		<MkSwitch v-model="flag" :class="$style.preview__content1__switch_button">
			<span>Switch is now {{ flag ? 'on' : 'off' }}</span>
		</MkSwitch>
		<div :class="$style.preview__content1__input">
			<MkRadio v-model="radio" value="misskey">Misskey</MkRadio>
			<MkRadio v-model="radio" value="mastodon">Mastodon</MkRadio>
			<MkRadio v-model="radio" value="pleroma">Pleroma</MkRadio>
		</div>
		<div :class="$style.preview__content1__button">
		<MkButton inline>This is</MkButton>
		<MkButton inline primary>the button</MkButton>
		</div>
	</div>
	<div :class="$style.preview__content2" style="pointer-events: none;">
		<Mfm :text="mfm"/>
	</div>
	<div :class="$style.preview__content3">
		<MkButton inline primary @click="openMenu">Open menu</MkButton>
		<MkButton inline primary @click="openDialog">Open dialog</MkButton>
		<MkButton inline primary @click="openForm">Open form</MkButton>
		<MkButton inline primary @click="openDrive">Open drive</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkRadio from '@/components/MkRadio.vue';
import * as os from '@/os.js';
import * as config from '@@/js/config.js';
import { $i } from '@/account.js';

const text = ref('');
const flag = ref(true);
const radio = ref('misskey');
const mfm = ref(`Hello world! This is an @example mention. BTW you are @${$i ? $i.username : 'guest'}.\nAlso, here is ${config.url} and [example link](${config.url}). for more details, see https://example.com.\nAs you know #misskey is open-source software.`);

const openDialog = async () => {
	await os.alert({
		type: 'warning',
		title: 'Oh my Aichan',
		text: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
	});
};

const openForm = async () => {
	await os.form('Example form', {
		foo: {
			type: 'boolean',
			default: true,
			label: 'This is a boolean property',
		},
		bar: {
			type: 'number',
			default: 300,
			label: 'This is a number property',
		},
		baz: {
			type: 'string',
			default: 'Misskey makes you happy.',
			label: 'This is a string property',
		},
	});
};

const openDrive = async () => {
	await os.selectDriveFile(false);
};

const selectUser = async () => {
	await os.selectUser();
};

const openMenu = async (ev: Event) => {
	os.popupMenu([{
		type: 'label',
		text: 'Fruits',
	}, {
		text: 'Create some apples',
		action: () => {},
	}, {
		text: 'Read some oranges',
		action: () => {},
	}, {
		text: 'Update some melons',
		action: () => {},
	}, {
		text: 'Delete some bananas',
		danger: true,
		action: () => {},
	}], ev.currentTarget ?? ev.target);
};
</script>

<style lang="scss" module>
.preview {
	padding: 16px;

	&__content1 {

		&__switch_button {
			padding: 16px 0 8px 0;
		}

		&__input {
			padding: 8px 0 8px 0;

			div {
				margin: 0 8px 8px 0;
			}
		}

		&__button {
			padding: 4px 0 8px 0;

			button {
				margin: 0 8px 8px 0;
			}
		}
	}

	&__content2 {
		padding: 8px 0 8px 0;
	}

	&__content3 {
		padding: 8px 0 8px 0;

		button {
			margin: 0 8px 8px 0;

		}
	}
}
</style>
