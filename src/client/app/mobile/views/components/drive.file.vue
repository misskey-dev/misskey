<template>
<a class="vupkuhvjnjyqaqhsiogfbywvjxynrgsm" @click.prevent="onClick" :href="`/i/drive/file/${ file.id }`" :data-is-selected="isSelected">
	<div class="container">
		<x-file-thumbnail class="thumbnail" :file="file" fit="cover"/>
		<div class="body">
			<p class="name">
				<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
				<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
			</p>
			<footer>
				<span class="type"><mk-file-type-icon :type="file.type"/>{{ file.type }}</span>
				<span class="separator"></span>
				<span class="data-size">{{ file.size | bytes }}</span>
				<span class="separator"></span>
				<span class="created-at"><fa :icon="['far', 'clock']"/><mk-time :time="file.createdAt"/></span>
				<template v-if="file.isSensitive">
					<span class="separator"></span>
					<span class="nsfw"><fa :icon="['far', 'eye-slash']"/> {{ $t('nsfw') }}</span>
				</template>
			</footer>
		</div>
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XFileThumbnail from '../../../common/views/components/drive-file-thumbnail.vue';

export default Vue.extend({
	i18n: i18n('mobile/views/components/drive.file.vue'),
	props: ['file'],
	components: {
		XFileThumbnail
	},
	data() {
		return {
			isSelected: false
		};
	},
	computed: {
		browser(): unknown {
			return this.$parent;
		}
	},
	created() {
		this.isSelected = this.browser.selectedFiles.some(f => f.id == this.file.id)

		this.browser.$on('change-selection', this.onBrowserChangeSelection);
	},
	beforeDestroy() {
		this.browser.$off('change-selection', this.onBrowserChangeSelection);
	},
	methods: {
		onBrowserChangeSelection(selections) {
			this.isSelected = selections.some(f => f.id == this.file.id);
		},
		onClick() {
			this.browser.chooseFile(this.file);
		}
	}
});
</script>

<style lang="stylus" scoped>
.vupkuhvjnjyqaqhsiogfbywvjxynrgsm
	display block
	text-decoration none !important

	*
		user-select none
		pointer-events none

	> .container
		display grid
		max-width 500px
		margin 0 auto
		padding 16px
		grid-template-columns 64px 1fr
		grid-column-gap 10px

		&:after
			content ""
			display block
			clear both

		> .thumbnail
			width 64px
			height 64px
			color var(--driveFileIcon)

		> .body
			display block
			word-break break-all

			> .name
				display block
				margin 0
				padding 0
				font-size 0.9em
				font-weight bold
				color var(--text)
				word-break break-word

				> .ext
					opacity 0.5

			> .tags
				display block
				margin 4px 0 0 0
				padding 0
				list-style none
				font-size 0.5em

				> .tag
					display inline-block
					margin 0 5px 0 0
					padding 1px 5px
					border-radius 2px

			> footer
				display block
				margin 4px 0 0 0
				font-size 0.7em
				color var(--text)

				> .separator
					padding 0 4px

				> .type
					opacity 0.7

					> .mk-file-type-icon
						margin-right 4px

				> .data-size
					opacity 0.7

				> .created-at
					opacity 0.7

					> [data-icon]
						margin-right 2px

				> .nsfw
					color #bf4633

	&[data-is-selected]
		background var(--primary)

		&, *
			color var(--primaryForeground) !important

</style>
