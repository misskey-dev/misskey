<template>
<XModalWindow @close="$emit('done')" :width="370">
	<template #header v-if="file">{{ file.name }}</template>
	<div class="cxqhhsmd" v-if="file">
		<div class="_section">
			<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
			<div class="info">
				<span style="margin-right: 1em;">{{ file.type }}</span>
				<span>{{ bytes(file.size) }}</span>
				<MkTime :time="file.createdAt" mode="detail" style="display: block;"/>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkSwitch @update:value="toggleIsSensitive" v-model:value="isSensitive">NSFW</MkSwitch>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton full @click="showUser"><Fa :icon="faExternalLinkSquareAlt"/> {{ $t('user') }}</MkButton>
				<MkButton full danger @click="del"><Fa :icon="faTrashAlt"/> {{ $t('delete') }}</MkButton>
			</div>
		</div>
		<div class="_section" v-if="info">
			<details class="_content rawdata">
				<pre><code>{{ JSON.stringify(info, null, 2) }}</code></pre>
			</details>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faTimes, faBookmark, faKey, faSync, faMicrophoneSlash, faExternalLinkSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { faSnowflake, faTrashAlt, faBookmark as farBookmark  } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/ui/switch.vue';
import XModalWindow from '@/components/modal-window.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import Progress from '@/scripts/loading';
import bytes from '@/filters/bytes';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkSwitch,
		XModalWindow,
		MkDriveFileThumbnail,
	},

	props: {
		fileId: {
			required: true,
		}
	},

	data() {
		return {
			file: null,
			info: null,
			isSensitive: false,
			faTimes, faBookmark, farBookmark, faKey, faSync, faMicrophoneSlash, faSnowflake, faTrashAlt, faExternalLinkSquareAlt
		};
	},

	created() {
		this.fetch();
	},

	methods: {
		async fetch() {
			Progress.start();
			this.file = await os.api('drive/files/show', { fileId: this.fileId });
			this.info = await os.api('admin/drive/show-file', { fileId: this.fileId });
			this.isSensitive = this.file.isSensitive;
			Progress.done();
		},

		async showUser() {
			os.modal(await import('./user-dialog.vue'), {
				userId: this.file.userId
			});
		},

		async del() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.file.name }),
				showCancelButton: true
			});
			if (canceled) return;

			os.api('drive/files/delete', {
				fileId: this.file.id
			}).then(() => {
				this.$refs.files.removeItem(x => x.id === this.file.id);
			});
		},

		async toggleIsSensitive(v) {
			await os.api('drive/files/update', { fileId: this.fileId, isSensitive: v });
			this.isSensitive = v;
		},

		bytes
	}
});
</script>

<style lang="scss" scoped>
.cxqhhsmd {
	> ._section {
		> .thumbnail {
			height: 150px;
			max-width: 100%;
		}

		> .info {
			text-align: center;
			margin-top: 8px;
		}
		
		> .rawdata {
			overflow: auto;
		}
	}
}
</style>
