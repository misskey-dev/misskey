<template>
<div class="ncvczrfv"
	:class="{ isSelected }"
	@click="onClick"
	@contextmenu.stop="onContextmenu"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
	:title="title"
>
	<div class="label" v-if="$i.avatarId == file.id">
		<img src="/static-assets/client/label.svg"/>
		<p>{{ $ts.avatar }}</p>
	</div>
	<div class="label" v-if="$i.bannerId == file.id">
		<img src="/static-assets/client/label.svg"/>
		<p>{{ $ts.banner }}</p>
	</div>
	<div class="label red" v-if="file.isSensitive">
		<img src="/static-assets/client/label-red.svg"/>
		<p>{{ $ts.nsfw }}</p>
	</div>

	<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>

	<p class="name">
		<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
		<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
	</p>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import MkDriveFileThumbnail from './drive-file-thumbnail.vue';
import bytes from '@client/filters/bytes';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkDriveFileThumbnail
	},

	props: {
		file: {
			type: Object,
			required: true,
		},
		isSelected: {
			type: Boolean,
			required: false,
			default: false,
		},
		selectMode: {
			type: Boolean,
			required: false,
			default: false,
		}
	},

	emits: ['chosen'],

	data() {
		return {
			isDragging: false
		};
	},

	computed: {
		// TODO: parentへの参照を無くす
		browser(): any {
			return this.$parent;
		},
		title(): string {
			return `${this.file.name}\n${this.file.type} ${bytes(this.file.size)}`;
		}
	},

	methods: {
		getMenu() {
			return [{
				text: this.$ts.rename,
				icon: 'fas fa-i-cursor',
				action: this.rename
			}, {
				text: this.file.isSensitive ? this.$ts.unmarkAsSensitive : this.$ts.markAsSensitive,
				icon: this.file.isSensitive ? 'fas fa-eye' : 'fas fa-eye-slash',
				action: this.toggleSensitive
			}, {
				text: this.$ts.describeFile,
				icon: 'fas fa-i-cursor',
				action: this.describe
			}, null, {
				text: this.$ts.copyUrl,
				icon: 'fas fa-link',
				action: this.copyUrl
			}, {
				type: 'a',
				href: this.file.url,
				target: '_blank',
				text: this.$ts.download,
				icon: 'fas fa-download',
				download: this.file.name
			}, null, {
				text: this.$ts.delete,
				icon: 'fas fa-trash-alt',
				danger: true,
				action: this.deleteFile
			}];
		},

		onClick(ev) {
			if (this.selectMode) {
				this.$emit('chosen', this.file);
			} else {
				os.modalMenu(this.getMenu(), ev.currentTarget || ev.target);
			}
		},

		onContextmenu(e) {
			os.contextMenu(this.getMenu(), e);
		},

		onDragstart(e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData(_DATA_TRANSFER_DRIVE_FILE_, JSON.stringify(this.file));
			this.isDragging = true;

			// 親ブラウザに対して、ドラッグが開始されたフラグを立てる
			// (=あなたの子供が、ドラッグを開始しましたよ)
			this.browser.isDragSource = true;
		},

		onDragend(e) {
			this.isDragging = false;
			this.browser.isDragSource = false;
		},

		rename() {
			os.dialog({
				title: this.$ts.renameFile,
				input: {
					placeholder: this.$ts.inputNewFileName,
					default: this.file.name,
					allowEmpty: false
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				os.api('drive/files/update', {
					fileId: this.file.id,
					name: name
				});
			});
		},

		describe() {
			os.dialog({
				title: this.$ts.describeFile,
				input: {
					placeholder: this.$ts.inputNewDescription,
					default: this.file.comment !== null ? this.file.comment : "",
					allowEmpty: true
				}
			}).then(({ canceled, result: comment }) => {
				if (canceled) return;
				os.api('drive/files/update', {
					fileId: this.file.id,
					comment: comment.length == 0 ? null : comment
				});
			});
		},

		toggleSensitive() {
			os.api('drive/files/update', {
				fileId: this.file.id,
				isSensitive: !this.file.isSensitive
			});
		},

		copyUrl() {
			copyToClipboard(this.file.url);
			os.success();
		},

		setAsAvatar() {
			os.updateAvatar(this.file);
		},

		setAsBanner() {
			os.updateBanner(this.file);
		},

		addApp() {
			alert('not implemented yet');
		},

		async deleteFile() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('driveFileDeleteConfirm', { name: this.file.name }),
				showCancelButton: true
			});
			if (canceled) return;

			os.api('drive/files/delete', {
				fileId: this.file.id
			});
		},

		bytes
	}
});
</script>

<style lang="scss" scoped>
.ncvczrfv {
	position: relative;
	padding: 8px 0 0 0;
	min-height: 180px;
	border-radius: 4px;

	&, * {
		cursor: pointer;
	}

	> * {
		pointer-events: none;
	}

	&:hover {
		background: rgba(#000, 0.05);

		> .label {
			&:before,
			&:after {
				background: #0b65a5;
			}

			&.red {
				&:before,
				&:after {
					background: #c12113;
				}
			}
		}
	}

	&:active {
		background: rgba(#000, 0.1);

		> .label {
			&:before,
			&:after {
				background: #0b588c;
			}

			&.red {
				&:before,
				&:after {
					background: #ce2212;
				}
			}
		}
	}

	&.isSelected {
		background: var(--accent);

		&:hover {
			background: var(--accentLighten);
		}

		&:active {
			background: var(--accentDarken);
		}

		> .label {
			&:before,
			&:after {
				display: none;
			}
		}

		> .name {
			color: #fff;
		}

		> .thumbnail {
			color: #fff;
		}
	}

	> .label {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;

		&:before,
		&:after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1;
			background: #0c7ac9;
		}

		&:before {
			top: 0;
			left: 57px;
			width: 28px;
			height: 8px;
		}

		&:after {
			top: 57px;
			left: 0;
			width: 8px;
			height: 28px;
		}

		&.red {
			&:before,
			&:after {
				background: #c12113;
			}
		}

		> img {
			position: absolute;
			z-index: 2;
			top: 0;
			left: 0;
		}

		> p {
			position: absolute;
			z-index: 3;
			top: 19px;
			left: -28px;
			width: 120px;
			margin: 0;
			text-align: center;
			line-height: 28px;
			color: #fff;
			transform: rotate(-45deg);
		}
	}

	> .thumbnail {
		width: 110px;
		height: 110px;
		margin: auto;
	}

	> .name {
		display: block;
		margin: 4px 0 0 0;
		font-size: 0.8em;
		text-align: center;
		word-break: break-all;
		color: var(--fg);
		overflow: hidden;

		> .ext {
			opacity: 0.5;
		}
	}
}
</style>
