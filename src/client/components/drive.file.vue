<template>
<div class="ncvczrfv"
	:data-is-selected="isSelected"
	@click="onClick"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
	:title="title"
>
	<div class="label" v-if="$store.state.i.avatarId == file.id">
		<img src="/assets/label.svg"/>
		<p>{{ $t('avatar') }}</p>
	</div>
	<div class="label" v-if="$store.state.i.bannerId == file.id">
		<img src="/assets/label.svg"/>
		<p>{{ $t('banner') }}</p>
	</div>
	<div class="label red" v-if="file.isSensitive">
		<img src="/assets/label-red.svg"/>
		<p>{{ $t('nsfw') }}</p>
	</div>

	<x-file-thumbnail class="thumbnail" :file="file" fit="contain"/>

	<p class="name">
		<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
		<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import copyToClipboard from '../scripts/copy-to-clipboard';
//import updateAvatar from '../api/update-avatar';
//import updateBanner from '../api/update-banner';
import XFileThumbnail from './drive-file-thumbnail.vue';
import { faDownload, faLink, faICursor, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import bytes from '../filters/bytes';

export default Vue.extend({
	components: {
		XFileThumbnail
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
		onClick(ev) {
			if (this.selectMode) {
				this.$emit('chosen', this.file);
			} else {
				this.$root.menu({
					items: [{
						text: this.$t('rename'),
						icon: faICursor,
						action: this.rename
					}, {
						text: this.file.isSensitive ? this.$t('unmarkAsSensitive') : this.$t('markAsSensitive'),
						icon: this.file.isSensitive ? faEye : faEyeSlash,
						action: this.toggleSensitive
					}, null, {
						text: this.$t('copyUrl'),
						icon: faLink,
						action: this.copyUrl
					}, {
						type: 'a',
						href: this.file.url,
						target: '_blank',
						text: this.$t('download'),
						icon: faDownload,
						download: this.file.name
					}, null, {
						text: this.$t('delete'),
						icon: faTrashAlt,
						action: this.deleteFile
					}],
					source: ev.currentTarget || ev.target,
				});
			}
		},

		onDragstart(e) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('mk_drive_file', JSON.stringify(this.file));
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
			this.$root.dialog({
				title: this.$t('renameFile'),
				input: {
					placeholder: this.$t('inputNewFileName'),
					default: this.file.name,
					allowEmpty: false
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				this.$root.api('drive/files/update', {
					fileId: this.file.id,
					name: name
				});
			});
		},

		toggleSensitive() {
			this.$root.api('drive/files/update', {
				fileId: this.file.id,
				isSensitive: !this.file.isSensitive
			});
		},

		copyUrl() {
			copyToClipboard(this.file.url);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		setAsAvatar() {
			updateAvatar(this.$root)(this.file);
		},

		setAsBanner() {
			updateBanner(this.$root)(this.file);
		},

		addApp() {
			alert('not implemented yet');
		},

		async deleteFile() {
			const { canceled } = await this.$root.dialog({
				type: 'warning',
				text: this.$t('driveFileDeleteConfirm', { name: this.file.name }),
				showCancelButton: true
			});
			if (canceled) return;

			this.$root.api('drive/files/delete', {
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

	&[data-is-selected] {
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
		width: 128px;
		height: 128px;
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
