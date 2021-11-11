<template>
<div class="xrmjdkdw">
	<MkContainer :foldable="true" class="lookup">
		<template #header><i class="fas fa-search"></i> {{ $ts.lookup }}</template>
		<div class="xrmjdkdw-lookup">
			<MkInput class="item" v-model="q" type="text" @enter="find()">
				<template #label>{{ $ts.fileIdOrUrl }}</template>
			</MkInput>
			<MkButton @click="find()" primary><i class="fas fa-search"></i> {{ $ts.lookup }}</MkButton>
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
				<MkInput v-model="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="pagination.params().origin === 'local'">
					<template #label>{{ $ts.host }}</template>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<template #label>MIME type</template>
				</MkInput>
			</div>
			<MkPagination :pagination="pagination" #default="{items}" class="urempief" ref="files">
				<button class="file _panel _button _gap" v-for="file in items" :key="file.id" @click="show(file, $event)">
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

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkContainer from '@/components/ui/container.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
		MkContainer,
		MkDriveFileThumbnail,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.files,
				icon: 'fas fa-cloud',
				bg: 'var(--bg)',
				actions: [{
					text: this.$ts.clearCachedFiles,
					icon: 'fas fa-trash-alt',
					handler: this.clear
				}]
			},
			q: null,
			origin: 'local',
			type: null,
			searchHost: '',
			pagination: {
				endpoint: 'admin/drive/files',
				limit: 10,
				params: () => ({
					type: (this.type && this.type !== '') ? this.type : null,
					origin: this.origin,
					hostname: (this.hostname && this.hostname !== '') ? this.hostname : null,
				}),
			},
		}
	},

	watch: {
		type() {
			this.$refs.files.reload();
		},
		origin() {
			this.$refs.files.reload();
		},
		searchHost() {
			this.$refs.files.reload();
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		clear() {
			os.dialog({
				type: 'warning',
				text: this.$ts.clearCachedFilesConfirm,
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.apiWithDialog('admin/drive/clean-remote-files', {});
			});
		},

		show(file, ev) {
			os.popup(import('./file-dialog.vue'), {
				fileId: file.id
			}, {}, 'closed');
		},

		find() {
			os.api('admin/drive/show-file', this.q.startsWith('http://') || this.q.startsWith('https://') ? { url: this.q.trim() } : { fileId: this.q.trim() }).then(file => {
				this.show(file);
			}).catch(e => {
				if (e.code === 'NO_SUCH_FILE') {
					os.dialog({
						type: 'error',
						text: this.$ts.notFound
					});
				}
			});
		},

		bytes
	}
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
