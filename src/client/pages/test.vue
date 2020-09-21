<template>
<div>
	<portal to="header"><Fa :icon="faExclamationTriangle"/>TEST</portal>

	<div class="_card _vMargin">
		<div class="_title">Dialog</div>
		<div class="_content">
			<MkInput v-model:value="dialogTitle">
				<span>Title</span>
			</MkInput>
			<MkInput v-model:value="dialogBody">
				<span>Body</span>
			</MkInput>
			<MkSwitch v-model:value="dialogCancel">
				<span>With cancel button</span>
			</MkSwitch>
			<MkSwitch v-model:value="dialogCancelByBgClick">
				<span>Can cancel by modal bg click</span>
			</MkSwitch>
			<MkSwitch v-model:value="dialogInput">
				<span>With input field</span>
			</MkSwitch>
			<MkButton @click="showDialog()">Show</MkButton>
		</div>
		<div class="_content">
			<span>Result: {{ dialogResult }}</span>
		</div>
	</div>

	<div class="_card _vMargin">
		<div class="_title">MFM</div>
		<div class="_content">
			<MkTextarea v-model:value="mfm">
				<span>MFM</span>
			</MkTextarea>
		</div>
		<div class="_content">
			<mfm :text="mfm"/>
		</div>
	</div>

	<div class="_card _vMargin">
		<div class="_title">selectDriveFile</div>
		<div class="_content">
			<MkButton @click="selectDriveFile()">selectDriveFile</MkButton>
		</div>
		<div class="_content">

		</div>
	</div>

	<div class="_card _vMargin">
		<div class="_title">selectDriveFolder</div>
		<div class="_content">
			<MkButton @click="selectDriveFolder()">selectDriveFolder</MkButton>
		</div>
		<div class="_content">

		</div>
	</div>


	<div class="_card _vMargin">
		<div class="_title">selectUser</div>
		<div class="_content">
			<MkButton @click="selectUser()">selectUser</MkButton>
		</div>
		<div class="_content">
			<span>Result: {{ user }}</span>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSwitch,
		MkTextarea,
	},

	metaInfo() {
		return {
			title: this.$t('notFound') as string
		};
	},

	data() {
		return {
			dialogTitle: 'Hello',
			dialogBody: 'World!',
			dialogCancel: false,
			dialogCancelByBgClick: true,
			dialogInput: false,
			dialogResult: null,
			mfm: '',
			user: null,
			faExclamationTriangle
		}
	},

	methods: {
		async showDialog() {
			this.dialogResult = null;
			this.dialogResult = await os.dialog({
				title: this.dialogTitle,
				text: this.dialogBody,
				showCancelButton: this.dialogCancel,
				cancelableByBgClick: this.dialogCancelByBgClick,
				input: this.dialogInput ? {} : null
			});
		},

		async selectDriveFile() {
			const files = await os.selectDriveFile();
		},

		async selectDriveFolder() {
			const folder = await os.selectDriveFolder();
		},

		async selectUser() {
			this.user = await os.selectUser();
		},
	}
});
</script>
