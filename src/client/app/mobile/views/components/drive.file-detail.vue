<template>
<div class="pyvicwrksnfyhpfgkjwqknuururpaztw">
	<div class="preview">
		<img v-if="kind == 'image'" ref="img"
			:src="file.url"
			:alt="file.name"
			:title="file.name"
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
			<span class="type"><mk-file-type-icon :type="file.type"/> {{ file.type }}</span>
			<span class="separator"></span>
			<span class="data-size">{{ file.datasize | bytes }}</span>
			<span class="separator"></span>
			<span class="created-at" @click="showCreatedAt">%fa:R clock%<mk-time :time="file.createdAt"/></span>
			<template v-if="file.isSensitive">
				<span class="separator"></span>
				<span class="nsfw">%fa:eye-slash% %i18n:@nsfw%</span>
			</template>
		</div>
	</div>
	<div class="menu">
		<div>
			<ui-button link :href="`${file.url}?download`" :download="file.name">%fa:download% %i18n:@download%</ui-button>
			<ui-button @click="rename">%fa:pencil-alt% %i18n:@rename%</ui-button>
			<ui-button @click="move">%fa:R folder-open% %i18n:@move%</ui-button>
			<ui-button @click="toggleSensitive" v-if="file.isSensitive">%fa:R eye% %i18n:@unmark-as-sensitive%</ui-button>
			<ui-button @click="toggleSensitive" v-else>%fa:R eye-slash% %i18n:@mark-as-sensitive%</ui-button>
			<ui-button @click="del">%fa:trash-alt R% %i18n:@delete%</ui-button>
		</div>
	</div>
	<div class="hash">
		<div>
			<p>
				%fa:hashtag%%i18n:@hash%
			</p>
			<code>{{ file.md5 }}</code>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { gcd } from '../../../../../prelude/math';

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
			return this.file.properties.avgColor && this.file.properties.avgColor.length == 3 ? {
				'background-color': `rgb(${ this.file.properties.avgColor.join(',') })`
			} : {};
		}
	},

	methods: {
		rename() {
			const name = window.prompt('%i18n:@rename%', this.file.name);
			if (name == null || name == '' || name == this.file.name) return;
			(this as any).api('drive/files/update', {
				fileId: this.file.id,
				name: name
			}).then(() => {
				this.browser.cf(this.file, true);
			});
		},

		move() {
			(this as any).apis.chooseDriveFolder().then(folder => {
				(this as any).api('drive/files/update', {
					fileId: this.file.id,
					folderId: folder == null ? null : folder.id
				}).then(() => {
					this.browser.cf(this.file, true);
				});
			});
		},

		del() {
			(this as any).api('drive/files/delete', {
				fileId: this.file.id
			}).then(() => {
				this.browser.cd(this.file.folderId, true);
			});
		},

		toggleSensitive() {
			(this as any).api('drive/files/update', {
				fileId: this.file.id,
				isSensitive: !this.file.isSensitive
			});

			this.file.isSensitive = !this.file.isSensitive;
		},

		showCreatedAt() {
			alert(new Date(this.file.createdAt).toLocaleString());
		}
	}
});
</script>

<style lang="stylus" scoped>
.pyvicwrksnfyhpfgkjwqknuururpaztw
	> .preview
		padding 8px
		background var(--bg)

		> img
			display block
			max-width 100%
			max-height 300px
			margin 0 auto
			box-shadow 1px 1px 4px rgba(#000, 0.2)

		> footer
			padding 8px 8px 0 8px
			text-align center
			font-size 0.8em
			color var(--text)
			opacity 0.7

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
		border-top solid 1px var(--faceDivider)

		> div
			max-width 500px
			margin 0 auto
			color var(--text)

			> .separator
				padding 0 4px

			> .created-at

				> [data-fa]
					margin-right 2px

			> .nsfw
				color #bf4633

	> .menu
		padding 14px
		border-top solid 1px var(--faceDivider)

		> div
			max-width 500px
			margin 0 auto

	> .hash
		padding 14px
		border-top solid 1px var(--faceDivider)

		> div
			max-width 500px
			margin 0 auto

			> p
				display block
				margin 0
				padding 0
				color var(--text)
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

</style>
