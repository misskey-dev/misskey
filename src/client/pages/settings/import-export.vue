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
		<MkButton inline primary @click="doExport"><Fa :icon="faDownload"/> {{ $t('export') }}</MkButton>
		<MkButton inline primary @click="doImport" :disabled="!['following', 'user-lists'].includes(exportTarget)"><Fa :icon="faUpload"/> {{ $t('import') }}</MkButton>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faDownload, faUpload, faBoxes } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSelect from '@/components/ui/select.vue';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';

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

		async doImport(e) {
			const file = await selectFile(e.currentTarget || e.target);
			
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
		},
	}
});
</script>
