<template>
<div class="file-detail">
	<div class="preview">
		<img v-if="kind == 'image'" ref="img"
			:src="file.url"
			:alt="file.name"
			:title="file.name"
			@load="onImageLoaded"
			:style="style">
		<template v-if="kind != 'image'">%fa:file%</template>
		<footer v-if="kind == 'image' && file.properties && file.properties.width && file.properties.height">
			<span class="size">
				<span class="width">{{ file.properties.width }}</span>
				<span class="time">×</span>
				<span class="height">{{ file.properties.height }}</span>
				<span class="px">px</span>
			</span>
			<span class="separator"></span>
			<span class="aspect-ratio">
				<span class="width">{{ file.properties.width / gcd(file.properties.width, file.properties.height) }}</span>
				<span class="colon">:</span>
				<span class="height">{{ file.properties.height / gcd(file.properties.width, file.properties.height) }}</span>
			</span>
		</footer>
	</div>
	<div class="info">
		<div>
			<span class="type"><mk-file-type-icon :type="file.type"/>{{ file.type }}</span>
			<span class="separator"></span>
			<span class="data-size">{{ file.datasize | bytes }}</span>
			<span class="separator"></span>
			<span class="created-at" @click="showCreatedAt">%fa:R clock%<mk-time :time="file.created_at"/></span>
		</div>
	</div>
	<div class="menu">
		<div>
			<a :href="`${file.url}?download`" :download="file.name">
				%fa:download%%i18n:mobile.tags.mk-drive-file-viewer.download%
			</a>
			<button @click="rename">
				%fa:pencil-alt%%i18n:mobile.tags.mk-drive-file-viewer.rename%
			</button>
			<button @click="move">
				%fa:R folder-open%%i18n:mobile.tags.mk-drive-file-viewer.move%
			</button>
		</div>
	</div>
	<div class="exif" v-show="exif">
		<div>
			<p>
				%fa:camera%%i18n:mobile.tags.mk-drive-file-viewer.exif%
			</p>
			<pre ref="exif" class="json">{{ exif ? JSON.stringify(exif, null, 2) : '' }}</pre>
		</div>
	</div>
	<div class="hash">
		<div>
			<p>
				%fa:hashtag%%i18n:mobile.tags.mk-drive-file-viewer.hash%
			</p>
			<code>{{ file.md5 }}</code>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as EXIF from 'exif-js';
import * as hljs from 'highlight.js';
import gcd from '../../../common/scripts/gcd';

export default Vue.extend({
	props: ['file'],
	data() {
		return {
			gcd,
			exif: null
		};
	},
	computed: {
		browser(): any {
			return this.$parent;
		},
		kind(): string {
			return this.file.type.split('/')[0];
		},
		style(): any {
			return this.file.properties.average_color ? {
				'background-color': `rgb(${ this.file.properties.average_color.join(',') })`
			} : {};
		}
	},
	methods: {
		rename() {
			const name = window.prompt('名前を変更', this.file.name);
			if (name == null || name == '' || name == this.file.name) return;
			(this as any).api('drive/files/update', {
				file_id: this.file.id,
				name: name
			}).then(() => {
				this.browser.cf(this.file, true);
			});
		},
		move() {
			(this as any).apis.chooseDriveFolder().then(folder => {
				(this as any).api('drive/files/update', {
					file_id: this.file.id,
					folder_id: folder == null ? null : folder.id
				}).then(() => {
					this.browser.cf(this.file, true);
				});
			});
		},
		showCreatedAt() {
			alert(new Date(this.file.created_at).toLocaleString());
		},
		onImageLoaded() {
			const self = this;
			EXIF.getData(this.$refs.img, function(this: any) {
				const allMetaData = EXIF.getAllTags(this);
				self.exif = allMetaData;
				hljs.highlightBlock(self.$refs.exif);
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.file-detail

	> .preview
		padding 8px
		background #f0f0f0

		> img
			display block
			max-width 100%
			max-height 300px
			margin 0 auto
			box-shadow 1px 1px 4px rgba(0, 0, 0, 0.2)

		> footer
			padding 8px 8px 0 8px
			font-size 0.8em
			color #888
			text-align center

			> .separator
				display inline
				padding 0 4px

			> .size
				display inline

				.time
					margin 0 2px

				.px
					margin-left 4px

			> .aspect-ratio
				display inline
				opacity 0.7

				&:before
					content "("

				&:after
					content ")"

	> .info
		padding 14px
		font-size 0.8em
		border-top solid 1px #dfdfdf

		> div
			max-width 500px
			margin 0 auto

			> .separator
				padding 0 4px
				color #cdcdcd

			> .type
			> .data-size
				color #9d9d9d

				> mk-file-type-icon
					margin-right 4px

			> .created-at
				color #bdbdbd

				> [data-fa]
					margin-right 2px

	> .menu
		padding 14px
		border-top solid 1px #dfdfdf

		> div
			max-width 500px
			margin 0 auto

			> *
				display block
				width 100%
				padding 10px 16px
				margin 0 0 12px 0
				color #333
				font-size 0.9em
				text-align center
				text-decoration none
				text-shadow 0 1px 0 rgba(255, 255, 255, 0.9)
				background-image linear-gradient(#fafafa, #eaeaea)
				border 1px solid #ddd
				border-bottom-color #cecece
				border-radius 3px

				&:last-child
					margin-bottom 0

				&:active
					background-color #767676
					background-image none
					border-color #444
					box-shadow 0 1px 3px rgba(0, 0, 0, 0.075), inset 0 0 5px rgba(0, 0, 0, 0.2)

				> [data-fa]
					margin-right 4px

	> .hash
		padding 14px
		border-top solid 1px #dfdfdf

		> div
			max-width 500px
			margin 0 auto

			> p
				display block
				margin 0
				padding 0
				color #555
				font-size 0.9em

				> [data-fa]
					margin-right 4px

			> code
				display block
				width 100%
				margin 6px 0 0 0
				padding 8px
				white-space nowrap
				overflow auto
				font-size 0.8em
				color #222
				border solid 1px #dfdfdf
				border-radius 2px
				background #f5f5f5

	> .exif
		padding 14px
		border-top solid 1px #dfdfdf

		> div
			max-width 500px
			margin 0 auto

			> p
				display block
				margin 0
				padding 0
				color #555
				font-size 0.9em

				> [data-fa]
					margin-right 4px

			> pre
				display block
				width 100%
				margin 6px 0 0 0
				padding 8px
				height 128px
				overflow auto
				font-size 0.9em
				border solid 1px #dfdfdf
				border-radius 2px
				background #f5f5f5

</style>
