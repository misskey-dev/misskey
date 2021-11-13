<template>
<div class="_card">
	<div class="_content">
		<MkInput v-model="text">
			<template #label>Text</template>
		</MkInput>
		<MkSwitch v-model="flag">
			<span>Switch is now {{ flag ? 'on' : 'off' }}</span>
		</MkSwitch>
		<div style="margin: 32px 0;">
			<MkRadio v-model="radio" value="misskey">Misskey</MkRadio>
			<MkRadio v-model="radio" value="mastodon">Mastodon</MkRadio>
			<MkRadio v-model="radio" value="pleroma">Pleroma</MkRadio>
		</div>
		<MkButton inline>This is</MkButton>
		<MkButton inline primary>the button</MkButton>
	</div>
	<div class="_content" style="pointer-events: none;">
		<Mfm :text="mfm"/>
	</div>
	<div class="_content">
		<MkButton inline primary @click="openMenu">Open menu</MkButton>
		<MkButton inline primary @click="openDialog">Open dialog</MkButton>
		<MkButton inline primary @click="openForm">Open form</MkButton>
		<MkButton inline primary @click="openDrive">Open drive</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkRadio from '@/components/form/radio.vue';
import * as os from '@/os';
import * as config from '@/config';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		MkTextarea,
		MkRadio,
	},

	data() {
		return {
			text: '',
			flag: true,
			radio: 'misskey',
			mfm: `Hello world! This is an @example mention. BTW you are @${this.$i ? this.$i.username : 'guest'}.\nAlso, here is ${config.url} and [example link](${config.url}). for more details, see https://example.com.\nAs you know #misskey is open-source software.`
		}
	},

	methods: {
		async openDialog() {
			os.dialog({
				type: 'warning',
				title: 'Oh my Aichan',
				text: 'Lorem ipsum dolor sit amet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			});
		},

		async openForm() {
			os.form('Example form', {
				foo: {
					type: 'boolean',
					default: true,
					label: 'This is a boolean property'
				},
				bar: {
					type: 'number',
					default: 300,
					label: 'This is a number property'
				},
				baz: {
					type: 'string',
					default: 'Misskey makes you happy.',
					label: 'This is a string property'
				},
			});
		},

		async openDrive() {
			os.selectDriveFile();
		},

		async selectUser() {
			os.selectUser();
		},

		async openMenu(ev) {
			os.popupMenu([{
				type: 'label',
				text: 'Fruits'
			}, {
				text: 'Create some apples',
				action: () => {},
			}, {
				text: 'Read some oranges',
				action: () => {},
			}, {
				text: 'Update some melons',
				action: () => {},
			}, null, {
				text: 'Delete some bananas',
				danger: true,
				action: () => {},
			}], ev.currentTarget || ev.target);
		},
	}
});
</script>
