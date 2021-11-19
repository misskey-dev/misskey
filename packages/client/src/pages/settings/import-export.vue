<template>
<div style="margin: 16px;">
	<FormSection>
		<template #label>{{ $ts._exportOrImport.allNotes }}</template>
		<MkButton :class="$style.button" inline @click="doExport('notes')"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.followingList }}</template>
		<MkButton :class="$style.button" inline @click="doExport('following')"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="doImport('following', $event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.userLists }}</template>
		<MkButton :class="$style.button" inline @click="doExport('user-lists')"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="doImport('user-lists', $event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.muteList }}</template>
		<MkButton :class="$style.button" inline @click="doExport('muting')"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="doImport('muting', $event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
	<FormSection>
		<template #label>{{ $ts._exportOrImport.blockingList }}</template>
		<MkButton :class="$style.button" inline @click="doExport('blocking')"><i class="fas fa-download"></i> {{ $ts.export }}</MkButton>
		<MkButton :class="$style.button" inline @click="doImport('blocking', $event)"><i class="fas fa-upload"></i> {{ $ts.import }}</MkButton>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormSection,
		MkButton,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.importAndExport,
				icon: 'fas fa-boxes',
				bg: 'var(--bg)',
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		doExport(target) {
			os.api(
				target === 'notes' ? 'i/export-notes' :
				target === 'following' ? 'i/export-following' :
				target === 'blocking' ? 'i/export-blocking' :
				target === 'user-lists' ? 'i/export-user-lists' :
				target === 'muting' ? 'i/export-mute' :
				null, {})
			.then(() => {
				os.alert({
					type: 'info',
					text: this.$ts.exportRequested
				});
			}).catch((e: any) => {
				os.alert({
					type: 'error',
					text: e.message
				});
			});
		},

		async doImport(target, e) {
			const file = await selectFile(e.currentTarget || e.target);
			
			os.api(
				target === 'following' ? 'i/import-following' :
				target === 'user-lists' ? 'i/import-user-lists' :
				target === 'muting' ? 'i/import-muting' :
				target === 'blocking' ? 'i/import-blocking' :
				null, {
					fileId: file.id
			}).then(() => {
				os.alert({
					type: 'info',
					text: this.$ts.importRequested
				});
			}).catch((e: any) => {
				os.alert({
					type: 'error',
					text: e.message
				});
			});
		},
	}
});
</script>

<style module>
.button {
	margin-right: 16px;
}
</style>
