<template>
<div class="gvfdktuvdgwhmztnuekzkswkjygptfcv"
	:data-is-selected="isSelected"
	:data-is-contextmenu-showing="isContextmenuShowing"
	@click="onClick"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
	@contextmenu.prevent.stop="onContextmenu"
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
import i18n from '../../../i18n';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';
import updateAvatar from '../../api/update-avatar';
import updateBanner from '../../api/update-banner';
import XFileThumbnail from '../../../common/views/components/drive-file-thumbnail.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/components/drive.file.vue'),
	props: ['file'],
	components: {
		XFileThumbnail
	},
	data() {
		return {
			isContextmenuShowing: false,
			isDragging: false
		};
	},
	computed: {
		browser(): any {
			return this.$parent;
		},
		isSelected(): boolean {
			return this.browser.selectedFiles.some(f => f.id == this.file.id);
		},
		title(): string {
			return `${this.file.name}\n${this.file.type} ${Vue.filter('bytes')(this.file.size)}`;
		}
	},
	methods: {
		onClick() {
			this.browser.chooseFile(this.file);
		},

		onContextmenu(e) {
			this.isContextmenuShowing = true;
			this.$contextmenu(e, [{
				type: 'item',
				text: this.$t('contextmenu.rename'),
				icon: 'i-cursor',
				action: this.rename
			}, {
				type: 'item',
				text: this.file.isSensitive ? this.$t('contextmenu.unmark-as-sensitive') : this.$t('contextmenu.mark-as-sensitive'),
				icon: this.file.isSensitive ? ['far', 'eye'] : ['far', 'eye-slash'],
				action: this.toggleSensitive
			}, null, {
				type: 'item',
				text: this.$t('contextmenu.copy-url'),
				icon: 'link',
				action: this.copyUrl
			}, {
				type: 'link',
				href: this.file.url,
				target: '_blank',
				text: this.$t('contextmenu.download'),
				icon: 'download',
				download: this.file.name
			}, null, {
				type: 'item',
				text: this.$t('@.delete'),
				icon: ['far', 'trash-alt'],
				action: this.deleteFile
			}, null, {
				type: 'nest',
				text: this.$t('contextmenu.else-files'),
				menu: [{
					type: 'item',
					text: this.$t('contextmenu.set-as-avatar'),
					action: this.setAsAvatar
				}, {
					type: 'item',
					text: this.$t('contextmenu.set-as-banner'),
					action: this.setAsBanner
				}]
			}, /*{
				type: 'nest',
				text: this.$t('contextmenu.open-in-app'),
				menu: [{
					type: 'item',
					text: '%i18n:@contextmenu.add-app%...',
					action: this.addApp
				}]
			}*/], {
				closed: () => {
					this.isContextmenuShowing = false;
				}
			});
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

		onThumbnailLoaded() {
			if (this.file.properties.avgColor) {
				anime({
					targets: this.$refs.thumbnail,
					backgroundColor: 'transparent', // TODO fade
					duration: 100,
					easing: 'linear'
				});
			}
		},

		rename() {
			this.$root.dialog({
				title: this.$t('contextmenu.rename-file'),
				input: {
					placeholder: this.$t('contextmenu.input-new-file-name'),
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
				title: this.$t('contextmenu.copied'),
				text: this.$t('contextmenu.copied-url-to-clipboard')
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

		deleteFile() {
			this.$root.api('drive/files/delete', {
				fileId: this.file.id
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.gvfdktuvdgwhmztnuekzkswkjygptfcv
	padding 8px 0 0 0
	min-height 180px
	border-radius 4px

	&, *
		cursor pointer

	&:hover
		background rgba(#000, 0.05)

		> .label
			&:before
			&:after
				background #0b65a5

			&.red
				&:before
				&:after
					background #c12113

	&:active
		background rgba(#000, 0.1)

		> .label
			&:before
			&:after
				background #0b588c

			&.red
				&:before
				&:after
					background #ce2212

	&[data-is-selected]
		background var(--primary)

		&:hover
			background var(--primaryLighten10)

		&:active
			background var(--primaryDarken10)

		> .label
			&:before
			&:after
				display none

		> .name
			color var(--primaryForeground)

		> .thumbnail
			color var(--primaryForeground)

	&[data-is-contextmenu-showing]
		&:after
			content ""
			pointer-events none
			position absolute
			top -4px
			right -4px
			bottom -4px
			left -4px
			border 2px dashed var(--primaryAlpha03)
			border-radius 4px

	> .label
		position absolute
		top 0
		left 0
		pointer-events none

		&:before
		&:after
			content ""
			display block
			position absolute
			z-index 1
			background #0c7ac9

		&:before
			top 0
			left 57px
			width 28px
			height 8px

		&:after
			top 57px
			left 0
			width 8px
			height 28px

		&.red
			&:before
			&:after
				background #c12113

		> img
			position absolute
			z-index 2
			top 0
			left 0

		> p
			position absolute
			z-index 3
			top 19px
			left -28px
			width 120px
			margin 0
			text-align center
			line-height 28px
			color #fff
			transform rotate(-45deg)

	> .thumbnail
		width 128px
		height 128px
		margin auto
		color var(--driveFileIcon)

	> .name
		display block
		margin 4px 0 0 0
		font-size 0.8em
		text-align center
		word-break break-all
		color var(--text)
		overflow hidden

		> .ext
			opacity 0.5

</style>
