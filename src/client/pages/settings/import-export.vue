<template>
<section class="_section">
	<div class="_title"><Fa :icon="faBoxes"/> {{ $t('importAndExport') }}</div>
	<div class="_content">
		<MkSelect v-model:value="exportTarget">
			<option value="notes">{{ $t('_exportOrImport.allNotes') }}</option>
			<option value="following">{{ $t('_exportOrImport.followingList') }}</option>
			<option value="user-lists">{{ $t('_exportOrImport.userLists') }}</option>
			<option value="mute">{{ $t('_exportOrImport.muteList') }}</option>
			<option value="blocking">{{ $t('_exportOrImport.blockingList') }}</option>
		</MkSelect>
		<MkButton inline @click="doExport()"><Fa :icon="faDownload"/> {{ $t('export') }}</MkButton>
		<MkButton inline @click="doImport()" :disabled="!['following', 'user-lists'].includes(exportTarget)"><Fa :icon="faUpload"/> {{ $t('import') }}</MkButton>
	</div>
	<input ref="file" type="file" style="display: none;" @change="onChangeFile"/>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faDownload, faUpload, faBoxes } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSelect from '@/components/ui/select.vue';
import { apiUrl } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSelect,
	},

	data() {
		return {
			exportTarget: 'notes',
			faDownload, faUpload, faBoxes
		}
	},

	methods: {
		doExport() {
			os.api(
				this.exportTarget == 'notes' ? 'i/export-notes' :
				this.exportTarget == 'following' ? 'i/export-following' :
				this.exportTarget == 'blocking' ? 'i/export-blocking' :
				this.exportTarget == 'user-lists' ? 'i/export-user-lists' :
				this.exportTarget == 'mute' ? 'i/export-mute' :
				null, {})
			.then(() => {
				os.dialog({
					type: 'info',
					text: this.$t('exportRequested')
				});
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message
				});
			});
		},

		doImport() {
			(this.$refs.file as any).click();
		},

		onChangeFile() {
			const [file] = Array.from((this.$refs.file as any).files);
			
			const data = new FormData();
			data.append('file', file);
			data.append('i', this.$store.state.i.token);

			const promise = fetch(apiUrl + '/drive/files/create', {
				method: 'POST',
				body: data
			})
			.then(response => response.json())
			.then(f => {
				this.reqImport(f);
			});
			os.promiseDialog(promise);
		},

		reqImport(file) {
			os.api(
				this.exportTarget == 'following' ? 'i/import-following' :
				this.exportTarget == 'user-lists' ? 'i/import-user-lists' :
				null, {
					fileId: file.id
			}).then(() => {
				os.dialog({
					type: 'info',
					text: this.$t('importRequested')
				});
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message
				});
			});
		}
	}
});
</script>
