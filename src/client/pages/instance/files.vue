<template>
<div class="xrmjdkdw">
	<div class="_section">
		<div class="_content">
			<MkButton primary @click="clear()"><Fa :icon="faTrashAlt"/> {{ $t('clearCachedFiles') }}</MkButton>
		</div>
	</div>

	<div class="_section">
		<div class="_content">
			<div class="inputs" style="display: flex;">
				<MkSelect v-model:value="origin" style="margin: 0; flex: 1;">
					<template #label>{{ $t('instance') }}</template>
					<option value="combined">{{ $t('all') }}</option>
					<option value="local">{{ $t('local') }}</option>
					<option value="remote">{{ $t('remote') }}</option>
				</MkSelect>
				<MkInput v-model:value="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="pagination.params().origin === 'local'">
					<span>{{ $t('host') }}</span>
				</MkInput>
			</div>
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model:value="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
					<span>{{ $t('type') }}</span>
				</MkInput>
			</div>
			<MkPagination :pagination="pagination" #default="{items}" class="urempief" ref="files" :auto-margin="false">
				<button class="file _panel _button _vMargin" v-for="file in items" :key="file.id" @click="menu(file, $event)">
					<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
					<div class="body">
						<div>
							<small style="opacity: 0.7;">{{ file.name }}</small>
						</div>
						<div>
							<MkAcct :user="file.user"/>
						</div>
						<div>
							<span style="margin-right: 1em;">{{ file.type }}</span>
							<span>{{ bytes(file.size) }}</span>
						</div>
						<div>
							<span>{{ $t('registeredDate') }}: <MkTime :time="file.createdAt" mode="detail"/></span>
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
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSelect from '@/components/ui/select.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkDriveFileThumbnail from '@/components/drive-file-thumbnail.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';

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
				header: [{
					title: this.$t('files'),
					icon: faCloud
				}],
			},
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
			faTrashAlt, faCloud
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
				text: this.$t('clearCachedFilesConfirm'),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				os.api('admin/drive/clean-remote-files', {}).then(() => {
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
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
