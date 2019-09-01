<template>
<div class="pyvicwrksnfyhpfgkjwqknuururpaztw">
	<div class="preview">
		<x-file-thumbnail class="preview" :file="file" :detail="true"/>
		<template v-if="kind != 'image'"><fa icon="file"/></template>
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
			<span class="data-size">{{ file.size | bytes }}</span>
			<span class="separator"></span>
			<span class="created-at" @click="showCreatedAt"><fa :icon="['far', 'clock']"/><mk-time :time="file.createdAt"/></span>
			<template v-if="file.isSensitive">
				<span class="separator"></span>
				<span class="nsfw"><fa :icon="['far', 'eye-slash']"/> {{ $t('nsfw') }}</span>
			</template>
		</div>
	</div>
	<div class="menu">
		<div>
			<ui-input readonly :value="file.url">URL</ui-input>
			<ui-button link :href="dlUrl" :download="file.name"><fa icon="download"/> {{ $t('download') }}</ui-button>
			<ui-button @click="rename"><fa icon="pencil-alt"/> {{ $t('rename') }}</ui-button>
			<ui-button @click="move"><fa :icon="['far', 'folder-open']"/> {{ $t('move') }}</ui-button>
			<ui-button @click="toggleSensitive" v-if="file.isSensitive"><fa :icon="['far', 'eye']"/> {{ $t('unmark-as-sensitive') }}</ui-button>
			<ui-button @click="toggleSensitive" v-else><fa :icon="['far', 'eye-slash']"/> {{ $t('mark-as-sensitive') }}</ui-button>
			<ui-button @click="del"><fa :icon="['far', 'trash-alt']"/> {{ $t('delete') }}</ui-button>
		</div>
	</div>
	<div class="hash">
		<div>
			<p>
				<fa icon="hashtag"/>{{ $t('hash') }}
			</p>
			<code>{{ file.md5 }}</code>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { gcd } from '../../../../../prelude/math';
import { appendQuery } from '../../../../../prelude/url';
import XFileThumbnail from '../../../common/views/components/drive-file-thumbnail.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/components/drive.file-detail.vue'),
	props: ['file'],

	components: {
		XFileThumbnail
	},

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
			return this.file.properties.avgColor ? {
				'background-color': this.file.properties.avgColor
			} : {};
		},

		dlUrl(): string {
			return appendQuery(this.file.url, 'download');
		}
	},

	methods: {
		rename() {
			const name = window.prompt(this.$t('rename'), this.file.name);
			if (name == null || name == '' || name == this.file.name) return;
			this.$root.api('drive/files/update', {
				fileId: this.file.id,
				name: name
			}).then(() => {
				this.browser.cf(this.file, true);
			});
		},

		move() {
			this.$chooseDriveFolder().then(folder => {
				this.$root.api('drive/files/update', {
					fileId: this.file.id,
					folderId: folder == null ? null : folder.id
				}).then(() => {
					this.browser.cf(this.file, true);
				});
			});
		},

		del() {
			this.$root.api('drive/files/delete', {
				fileId: this.file.id
			}).then(() => {
				this.browser.cd(this.file.folderId);
			});
		},

		toggleSensitive() {
			this.$root.api('drive/files/update', {
				fileId: this.file.id,
				isSensitive: !this.file.isSensitive
			});

			this.file.isSensitive = !this.file.isSensitive;
		},

		showCreatedAt() {
			this.$root.dialog({
				type: 'info',
				text: (new Date(this.file.createdAt)).toLocaleString()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.pyvicwrksnfyhpfgkjwqknuururpaztw
	> .preview
		padding 8px
		background var(--bg)

		> .preview
			width fit-content
			width -moz-fit-content
			max-width 100%
			margin 0 auto
			box-shadow 1px 1px 4px rgba(#000, 0.2)
			overflow hidden
			color var(--driveFileIcon)
			justify-content center

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

				> [data-icon]
					margin-right 2px

			> .nsfw
				color #bf4633

	> .menu
		padding 0 14px 14px 14px
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

				> [data-icon]
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
