<template>
<div>
	<div class="_section">
		<MkInfo warn>{{ $t('editTheseSettingsMayBreakAccount') }}</MkInfo>
	</div>
	<div class="_section">
		<div class="_title">Account</div>
		<div class="_content">
			<MkTextarea v-model:value="settings" code tall></MkTextarea>
			<!--<MkButton @click="saveSettings">Save</MkButton>-->
		</div>
	</div>
	<div class="_section">
		<div class="_title">Device</div>
		<div class="_content">
			<MkTextarea v-model:value="deviceSettings" code tall></MkTextarea>
			<MkButton @click="saveDeviceSettings">Save</MkButton>
		</div>
	</div>
	<div class="_section">
		<div class="_title">Device (per account)</div>
		<div class="_content">
			<MkTextarea v-model:value="deviceUserSettings" code tall></MkTextarea>
			<MkButton @click="saveDeviceUserSettings">Save</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import * as JSON5 from 'json5';
import MkInfo from '@/components/ui/info.vue';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInfo, MkButton, MkTextarea
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				header: [{
					title: 'RegEdit',
					icon: faCode
				}]
			},

			settings: JSON5.stringify(this.$store.state.settings, null, '\t'),
			deviceSettings: JSON5.stringify(this.$store.state.device, null, '\t'),
			deviceUserSettings: JSON5.stringify(this.$store.state.deviceUser, null, '\t'),
		};
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		saveDeviceSettings() {
			const obj = JSON5.parse(this.deviceSettings);
			this.$store.commit('device/overwrite', obj);
		},

		saveDeviceUserSettings() {
			const obj = JSON5.parse(this.deviceUserSettings);
			this.$store.commit('deviceUser/overwrite', obj);
		},
	}
});
</script>
