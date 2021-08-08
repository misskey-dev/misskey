<template>
<XModalWindow ref="dialog"
	:width="370"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
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
				<MkSwitch @update:modelValue="toggleIsSensitive" v-model="isSensitive">NSFW</MkSwitch>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton full @click="showUser"><i class="fas fa-external-link-square-alt"></i> {{ $ts.user }}</MkButton>
				<MkButton full danger @click="del"><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</MkButton>
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
import MkButton from '@client/components/ui/button.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import MkDriveFileThumbnail from '@client/components/drive-file-thumbnail.vue';
import Progress from '@client/scripts/loading';
import bytes from '@client/filters/bytes';
import * as os from '@client/os';

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

	emits: ['closed'],

	data() {
		return {
			file: null,
			info: null,
			isSensitive: false,
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

		showUser() {
			os.pageWindow(`/user-info/${this.file.userId}`);
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
