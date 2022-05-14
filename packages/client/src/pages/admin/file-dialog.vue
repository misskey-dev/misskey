<template>
<XModalWindow ref="dialog"
	:width="370"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template v-if="file" #header>{{ file.name }}</template>
	<div v-if="file" class="cxqhhsmd">
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
				<MkSwitch v-model="isSensitive" @update:modelValue="toggleIsSensitive">NSFW</MkSwitch>
			</div>
		</div>
		<div class="_section">
			<div class="_content">
				<MkButton full @click="showUser"><i class="fas fa-external-link-square-alt"></i> {{ $ts.user }}</MkButton>
				<MkButton full danger @click="del"><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</MkButton>
			</div>
		</div>
		<div v-if="info" class="_section">
			<details class="_content rawdata">
				<pre><code>{{ JSON.stringify(info, null, 2) }}</code></pre>
			</details>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkSwitch from '@/components/form/switch.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import { i18n } from '@/i18n';

let file: any = $ref(null);
let info: any = $ref(null);
let isSensitive: boolean = $ref(false);

const props = defineProps<{
	fileId: string,
}>();

async function fetch() {
	file = await os.api('drive/files/show', { fileId: props.fileId });
	info = await os.api('admin/drive/show-file', { fileId: props.fileId });
	isSensitive = file.isSensitive;
}

fetch();

function showUser() {
	os.pageWindow(`/user-info/${file.userId}`);
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: file.name }),
	});
	if (canceled) return;

	os.apiWithDialog('drive/files/delete', {
		fileId: file.id
	});
}

async function toggleIsSensitive(v) {
	await os.api('drive/files/update', { fileId: props.fileId, isSensitive: v });
	isSensitive = v;
}
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
