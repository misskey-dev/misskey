<template>
<section class="uawsfosz _card">
	<div class="_title"><fa :icon="faCloud"/> {{ $t('drive') }}</div>
	<div class="_content">
		<mk-pagination :pagination="drivePagination" #default="{items}" class="drive" ref="drive">
			<div class="file" v-for="(file, i) in items" :key="file.id" @click="selected = file" :class="{ selected: selected && (selected.id === file.id) }">
				<x-file-thumbnail class="thumbnail" :file="file" fit="cover"/>
				<div class="body">
					<p class="name">
						<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
						<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
					</p>
					<footer>
						<span class="type"><x-file-type-icon :type="file.type" class="icon"/>{{ file.type }}</span>
						<span class="separator"></span>
						<span class="data-size">{{ file.size | bytes }}</span>
						<span class="separator"></span>
						<span class="created-at"><fa :icon="faClock"/><mk-time :time="file.createdAt"/></span>
						<template v-if="file.isSensitive">
							<span class="separator"></span>
							<span class="nsfw"><fa :icon="faEyeSlash"/> {{ $t('nsfw') }}</span>
						</template>
					</footer>
				</div>
			</div>
		</mk-pagination>
	</div>
	<div class="_footer">
		<mk-button primary inline :disabled="selected == null" @click="download()"><fa :icon="faDownload"/> {{ $t('download') }}</mk-button>
		<mk-button inline :disabled="selected == null" @click="del()"><fa :icon="faTrashAlt"/> {{ $t('delete') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCloud, faDownload } from '@fortawesome/free-solid-svg-icons';
import { faClock, faEyeSlash, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XFileTypeIcon from '../../components/file-type-icon.vue';
import XFileThumbnail from '../../components/drive-file-thumbnail.vue';
import MkButton from '../../components/ui/button.vue';
import MkPagination from '../../components/ui/pagination.vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n,

	components: {
		XFileTypeIcon,
		XFileThumbnail,
		MkPagination,
		MkButton,
	},

	data() {
		return {
			selected: null,
			connection: null,
			drivePagination: {
				endpoint: 'drive/files',
				limit: 10,
			},
			faCloud, faClock, faEyeSlash, faDownload, faTrashAlt
		}
	},

	created() {
		this.connection = this.$root.stream.useSharedConnection('drive');

		this.connection.on('fileCreated', this.onStreamDriveFileCreated);
		this.connection.on('fileUpdated', this.onStreamDriveFileUpdated);
		this.connection.on('fileDeleted', this.onStreamDriveFileDeleted);
	},

	beforeDestroy() {
		this.connection.dispose();
	},

	methods: {
		onStreamDriveFileCreated(file) {
			this.$refs.drive.prepend(file);
		},

		onStreamDriveFileUpdated(file) {
			// TODO
		},

		onStreamDriveFileDeleted(fileId) {
			this.$refs.drive.remove(x => x.id === fileId);
		},

		download() {
			window.open(this.selected.url, '_blank');
		},

		async del() {
			const { canceled } = await this.$root.dialog({
				type: 'warning',
				text: this.$t('driveFileDeleteConfirm', { name: this.selected.name }),
				showCancelButton: true
			});
			if (canceled) return;

			this.$root.api('drive/files/delete', {
				fileId: this.selected.id
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.uawsfosz {
	> ._content {
		max-height: 350px;
		overflow: auto;
		
		> .drive {
			> .file {
				display: grid;
				margin: 0 auto;
				grid-template-columns: 64px 1fr;
				grid-column-gap: 10px;
				cursor: pointer;

				&.selected {
					background: var(--accent);
					box-shadow: 0 0 0 8px var(--accent);
					color: #fff;
				}

				&:not(:last-child) {
					margin-bottom: 16px;
				}

				> .thumbnail {
					width: 64px;
					height: 64px;
				}

				> .body {
					display: block;
					word-break: break-all;
					padding-top: 4px;

					> .name {
						display: block;
						margin: 0;
						padding: 0;
						font-size: 0.9em;
						font-weight: bold;
						word-break: break-word;

						> .ext {
							opacity: 0.5;
						}
					}

					> .tags {
						display: block;
						margin: 4px 0 0 0;
						padding: 0;
						list-style: none;
						font-size: 0.5em;

						> .tag {
							display: inline-block;
							margin: 0 5px 0 0;
							padding: 1px 5px;
							border-radius: 2px;
						}
					}

					> footer {
						display: block;
						margin: 4px 0 0 0;
						font-size: 0.7em;

						> .separator {
							padding: 0 4px;
						}

						> .type {
							opacity: 0.7;

							> .icon {
								margin-right: 4px;
							}
						}

						> .data-size {
							opacity: 0.7;
						}

						> .created-at {
							opacity: 0.7;

							> [data-icon] {
								margin-right: 2px;
							}
						}

						> .nsfw {
							color: #bf4633;
						}
					}
				}
			}
		}
	}
}
</style>
