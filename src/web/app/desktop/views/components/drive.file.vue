<template>
<div class="root file"
	:data-is-selected="isSelected"
	:data-is-contextmenu-showing="isContextmenuShowing"
	@click="onClick"
	draggable="true"
	@dragstart="onDragstart"
	@dragend="onDragend"
	@contextmenu.prevent.stop="onContextmenu"
	:title="title"
>
	<div class="label" v-if="os.i.avatar_id == file.id"><img src="/assets/label.svg"/>
		<p>%i18n:desktop.tags.mk-drive-browser-file.avatar%</p>
	</div>
	<div class="label" v-if="os.i.banner_id == file.id"><img src="/assets/label.svg"/>
		<p>%i18n:desktop.tags.mk-drive-browser-file.banner%</p>
	</div>
	<div class="thumbnail" ref="thumbnail" :style="`background-color: ${ background }`">
		<img :src="`${file.url}?thumbnail&size=128`" alt="" @load="onThumbnailLoaded"/>
	</div>
	<p class="name">
		<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
		<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
	</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';
import contextmenu from '../../api/contextmenu';
import copyToClipboard from '../../../common/scripts/copy-to-clipboard';

export default Vue.extend({
	props: ['file'],
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
			return `${this.file.name}\n${this.file.type} ${Vue.filter('bytes')(this.file.datasize)}`;
		},
		background(): string {
			return this.file.properties.average_color
				? `rgb(${this.file.properties.average_color.join(',')})`
				: 'transparent';
		}
	},
	methods: {
		onClick() {
			this.browser.chooseFile(this.file);
		},

		onContextmenu(e) {
			this.isContextmenuShowing = true;
			contextmenu(e, [{
				type: 'item',
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.rename%',
				icon: '%fa:i-cursor%',
				onClick: this.rename
			}, {
				type: 'item',
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copy-url%',
				icon: '%fa:link%',
				onClick: this.copyUrl
			}, {
				type: 'link',
				href: `${this.file.url}?download`,
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.download%',
				icon: '%fa:download%',
			}, {
				type: 'divider',
			}, {
				type: 'item',
				text: '%i18n:common.delete%',
				icon: '%fa:R trash-alt%',
				onClick: this.deleteFile
			}, {
				type: 'divider',
			}, {
				type: 'nest',
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.else-files%',
				menu: [{
					type: 'item',
					text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.set-as-avatar%',
					onClick: this.setAsAvatar
				}, {
					type: 'item',
					text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.set-as-banner%',
					onClick: this.setAsBanner
				}]
			}, {
				type: 'nest',
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.open-in-app%',
				menu: [{
					type: 'item',
					text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.add-app%...',
					onClick: this.addApp
				}]
			}], {
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
			if (this.file.properties.average_color) {
				anime({
					targets: this.$refs.thumbnail,
					backgroundColor: `rgba(${this.file.properties.average_color.join(',')}, 0)`,
					duration: 100,
					easing: 'linear'
				});
			}
		},

		rename() {
			(this as any).apis.input({
				title: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.rename-file%',
				placeholder: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.input-new-file-name%',
				default: this.file.name,
				allowEmpty: false
			}).then(name => {
				(this as any).api('drive/files/update', {
					file_id: this.file.id,
					name: name
				})
			});
		},

		copyUrl() {
			copyToClipboard(this.file.url);
			(this as any).apis.dialog({
				title: '%fa:check%%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copied%',
				text: '%i18n:desktop.tags.mk-drive-browser-file-contextmenu.copied-url-to-clipboard%',
				actions: [{
					text: '%i18n:common.ok%'
				}]
			});
		},

		setAsAvatar() {
			(this as any).apis.updateAvatar(this.file);
		},

		setAsBanner() {
			(this as any).apis.updateBanner(this.file);
		},

		addApp() {
			alert('not implemented yet');
		},

		deleteFile() {
			alert('not implemented yet');
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.file
	padding 8px 0 0 0
	height 180px
	border-radius 4px

	&, *
		cursor pointer

	&:hover
		background rgba(0, 0, 0, 0.05)

		> .label
			&:before
			&:after
				background #0b65a5

	&:active
		background rgba(0, 0, 0, 0.1)

		> .label
			&:before
			&:after
				background #0b588c

	&[data-is-selected]
		background $theme-color

		&:hover
			background lighten($theme-color, 10%)

		&:active
			background darken($theme-color, 10%)

		> .label
			&:before
			&:after
				display none

		> .name
			color $theme-color-foreground

	&[data-is-contextmenu-showing]
		&:after
			content ""
			pointer-events none
			position absolute
			top -4px
			right -4px
			bottom -4px
			left -4px
			border 2px dashed rgba($theme-color, 0.3)
			border-radius 4px

	> .label
		position absolute
		top 0
		left 0
		pointer-events none

		&:before
			content ""
			display block
			position absolute
			z-index 1
			top 0
			left 57px
			width 28px
			height 8px
			background #0c7ac9

		&:after
			content ""
			display block
			position absolute
			z-index 1
			top 57px
			left 0
			width 8px
			height 28px
			background #0c7ac9

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

		> img
			display block
			position absolute
			top 0
			left 0
			right 0
			bottom 0
			margin auto
			max-width 128px
			max-height 128px
			pointer-events none

	> .name
		display block
		margin 4px 0 0 0
		font-size 0.8em
		text-align center
		word-break break-all
		color #444
		overflow hidden

		> .ext
			opacity 0.5

</style>
