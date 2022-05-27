<template>
<div class="xrmjdkdw">
	<MkContainer :foldable="true" class="lookup">
		<template #header><i class="fas fa-search"></i> {{ $ts.lookup }}</template>
		<div class="xrmjdkdw-lookup">
			<MkInput v-model="q" class="item" type="text" @enter="find()">
				<template #label>{{ $ts.fileIdOrUrl }}</template>
			</MkInput>
			<MkButton primary @click="find()"><i class="fas fa-search"></i> {{ $ts.lookup }}</MkButton>
		</div>
	</MkContainer>

	<div class="_section">
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<MkSelect v-model="origin" style="margin: 0; flex: 1;">
					<template #label>{{ $ts.instance }}</template>
					<option value="combined">{{ $ts.all }}</option>
					<option value="local">{{ $ts.local }}</option>
					<option value="remote">{{ $ts.remote }}</option>
				</MkSelect>
				<MkInput v-model="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="pagination.params.origin === 'local'">
					<template #label>{{ $ts.host }}</template>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>MIME type</template>
				</MkInput>
			</div>
			<MkPagination v-slot="{items}" :pagination="pagination" class="urempief">
				<button v-for="file in items" :key="file.id" class="file _panel _button _gap" @click="show(file, $event)">
					<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
					<div class="body">
						<div>
							<small style="opacity: 0.7;">{{ file.name }}</small>
						</div>
						<div>
							<MkAcct v-if="file.user" :user="file.user"/>
							<div v-else>{{ $ts.system }}</div>
						</div>
						<div>
							<span style="margin-right: 1em;">{{ file.type }}</span>
							<span>{{ bytes(file.size) }}</span>
						</div>
						<div>
							<span>{{ $ts.registeredDate }}: <MkTime :time="file.createdAt" mode="detail"/></span>
						</div>
					</div>
				</button>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkContainer from '@/components/ui/container.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

let q = $ref(null);
let origin = $ref('local');
let type = $ref(null);
let searchHost = $ref('');
const pagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 10,
	params: computed(() => ({
		type: (type && type !== '') ? type : null,
		origin: origin,
		hostname: (searchHost && searchHost !== '') ? searchHost : null,
	})),
};

function clear() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.clearCachedFilesConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/drive/clean-remote-files', {});
	});
}

function show(file) {
	os.popup(defineAsyncComponent(() => import('./file-dialog.vue')), {
		fileId: file.id
	}, {}, 'closed');
}

function find() {
	os.api('admin/drive/show-file', q.startsWith('http://') || q.startsWith('https://') ? { url: q.trim() } : { fileId: q.trim() }).then(file => {
		show(file);
	}).catch(err => {
		if (err.code === 'NO_SUCH_FILE') {
			os.alert({
				type: 'error',
				text: i18n.ts.notFound
			});
		}
	});
}

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: i18n.ts.files,
		icon: 'fas fa-cloud',
		bg: 'var(--bg)',
		actions: [{
			text: i18n.ts.clearCachedFiles,
			icon: 'fas fa-trash-alt',
			handler: clear,
		}],
	})),
});
</script>

<style lang="scss" scoped>
.xrmjdkdw {
	margin: var(--margin);

	> .lookup {
		margin-bottom: 16px;
	}

	.urempief {
		margin-top: var(--margin);

		> .file {
			display: flex;
			width: 100%;
			box-sizing: border-box;
			text-align: left;
			align-items: center;

			&:hover {
				color: var(--accent);
			}

			> .thumbnail {
				width: 128px;
				height: 128px;
			}

			> .body {
				margin-left: 0.3em;
				padding: 8px;
				flex: 1;

				@media (max-width: 500px) {
					font-size: 14px;
				}
			}
		}
	}
}

.xrmjdkdw-lookup {
	padding: 16px;

	> .item {
		margin-bottom: 16px;
	}
}
</style>
