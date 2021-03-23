<template>
<div class="xrmjdkdw">
	<div class="_section">
		<div class="_content">
			<MkButton primary @click="clear()"><Fa :icon="faTrashAlt"/> {{ $ts.clearCachedFiles }}</MkButton>
		</div>
	</div>

	<div class="_section lookup">
		<div class="_title"><Fa :icon="faSearch"/> {{ $ts.lookup }}</div>
		<div class="_content">
			<MkInput class="target" v-model:value="q" type="text" @enter="find()">
				<span>{{ $ts.fileIdOrUrl }}</span>
			</MkInput>
			<MkButton @click="find()" primary><Fa :icon="faSearch"/> {{ $ts.lookup }}</MkButton>
		</div>
	</div>

	<div class="_section">
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<MkSelect v-model:value="origin" style="margin: 0; flex: 1;">
					<template #label>{{ $ts.instance }}</template>
					<option value="combined">{{ $ts.all }}</option>
					<option value="local">{{ $ts.local }}</option>
					<option value="remote">{{ $ts.remote }}</option>
				</MkSelect>
				<MkInput v-model:value="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="pagination.params().origin === 'local'">
					<span>{{ $ts.host }}</span>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model:value="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<span>{{ $ts.type }}</span>
				</MkInput>
			</div>
			<MkPagination :pagination="pagination" #default="{items}" class="urempief" ref="files">
				<button class="file _panel _button _vMargin" v-for="file in items" :key="file.id" @click="show(file, $event)">
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
import { faCloud, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkDriveFileThumbnail from '@client/components/drive-file-thumbnail.vue';
import bytes from '@client/filters/bytes';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkPagination,
		MkDriveFileThumbnail,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.files,
				icon: faCloud
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
			faTrashAlt, faCloud, faSearch,
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
</style>
