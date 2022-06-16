<template>
<div class="xrmjdkdw">
	<div>
		<div class="inputs" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
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
		<MkPagination v-slot="{items}" :pagination="pagination" class="urempief" :class="{ grid: viewMode === 'grid' }">
			<button v-for="file in items" :key="file.id" v-tooltip.mfm="`${file.type}\n${bytes(file.size)}\n${new Date(file.createdAt).toLocaleString()}\nby ${file.user ? '@' + Acct.toString(file.user) : 'system'}`" class="file _panel _button" @click="show(file, $event)">
				<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
				<div v-if="viewMode === 'list'" class="body">
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
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import * as Acct from 'misskey-js/built/acct';
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

let origin = $ref('local');
let type = $ref(null);
let searchHost = $ref('');
let viewMode = $ref('grid');
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
		fileId: file.id,
	}, {}, 'closed');
}

async function find() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.fileIdOrUrl,
		allowEmpty: false,
	});
	if (canceled) return;

	os.api('admin/drive/show-file', q.startsWith('http://') || q.startsWith('https://') ? { url: q.trim() } : { fileId: q.trim() }).then(file => {
		show(file);
	}).catch(err => {
		if (err.code === 'NO_SUCH_FILE') {
			os.alert({
				type: 'error',
				text: i18n.ts.notFound,
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
			text: i18n.ts.lookup,
			icon: 'fas fa-search',
			handler: find,
		}, {
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

	.urempief {
		margin-top: var(--margin);

		&.list {
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

		&.grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			grid-gap: 12px;
			margin: var(--margin) 0;

			> .file {
				aspect-ratio: 1;
			
				> .thumbnail {
					width: 100%;
					height: 100%;
				}
			}
		}
	}
}
</style>
