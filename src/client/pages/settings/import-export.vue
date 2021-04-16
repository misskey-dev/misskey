<template>
<FormBase>
	<FormGroup>
		<template #label>{{ $ts._exportOrImport.allNotes }}</template>
		<FormButton @click="doExport('notes')"><Fa :icon="faDownload"/> {{ $ts.export }}</FormButton>
	</FormGroup>
	<FormGroup>
		<template #label>{{ $ts._exportOrImport.followingList }}</template>
		<FormButton @click="doExport('following')"><Fa :icon="faDownload"/> {{ $ts.export }}</FormButton>
		<FormButton @click="doImport('following', $event)"><Fa :icon="faUpload"/> {{ $ts.import }}</FormButton>
	</FormGroup>
	<FormGroup>
		<template #label>{{ $ts._exportOrImport.userLists }}</template>
		<FormButton @click="doExport('user-lists')"><Fa :icon="faDownload"/> {{ $ts.export }}</FormButton>
		<FormButton @click="doImport('user-lists', $event)"><Fa :icon="faUpload"/> {{ $ts.import }}</FormButton>
	</FormGroup>
	<FormGroup>
		<template #label>{{ $ts._exportOrImport.muteList }}</template>
		<FormButton @click="doExport('mute')"><Fa :icon="faDownload"/> {{ $ts.export }}</FormButton>
	</FormGroup>
	<FormGroup>
		<template #label>{{ $ts._exportOrImport.blockingList }}</template>
		<FormButton @click="doExport('blocking')"><Fa :icon="faDownload"/> {{ $ts.export }}</FormButton>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faDownload, faUpload, faBoxes } from '@fortawesome/free-solid-svg-icons';
import FormSelect from '@client/components/form/select.vue';
import FormButton from '@client/components/form/button.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import * as os from '@client/os';
import { selectFile } from '@client/scripts/select-file';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormGroup,
		FormButton,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.importAndExport,
				icon: faBoxes
			},
			faDownload, faUpload, faBoxes
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		doExport(target) {
			os.api(
				target == 'notes' ? 'i/export-notes' :
				target == 'following' ? 'i/export-following' :
				target == 'blocking' ? 'i/export-blocking' :
				target == 'user-lists' ? 'i/export-user-lists' :
				target == 'mute' ? 'i/export-mute' :
				null, {})
			.then(() => {
				os.dialog({
					type: 'info',
					text: this.$ts.exportRequested
				});
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message
				});
			});
		},

		async doImport(target, e) {
			const file = await selectFile(e.currentTarget || e.target);
			
			os.api(
				target == 'following' ? 'i/import-following' :
				target == 'user-lists' ? 'i/import-user-lists' :
				null, {
					fileId: file.id
			}).then(() => {
				os.dialog({
					type: 'info',
					text: this.$ts.importRequested
				});
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message
				});
			});
		},
	}
});
</script>
