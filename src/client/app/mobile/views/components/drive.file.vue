<template>
<a class="vupkuhvjnjyqaqhsiogfbywvjxynrgsm" @click.prevent="onClick" :href="`/i/drive/file/${ file.id }`" :data-is-selected="isSelected">
	<div class="container">
		<div class="thumbnail" :style="thumbnail"></div>
		<div class="body">
			<p class="name">
				<span>{{ file.name.lastIndexOf('.') != -1 ? file.name.substr(0, file.name.lastIndexOf('.')) : file.name }}</span>
				<span class="ext" v-if="file.name.lastIndexOf('.') != -1">{{ file.name.substr(file.name.lastIndexOf('.')) }}</span>
			</p>
			<footer>
				<span class="type"><mk-file-type-icon :type="file.type"/>{{ file.type }}</span>
				<span class="separator"></span>
				<span class="data-size">{{ file.datasize | bytes }}</span>
				<span class="separator"></span>
				<span class="created-at">%fa:R clock%<mk-time :time="file.createdAt"/></span>
				<template v-if="file.isSensitive">
					<span class="separator"></span>
					<span class="nsfw">%fa:eye-slash% %i18n:@nsfw%</span>
				</template>
			</footer>
		</div>
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['file'],
	data() {
		return {
			isSelected: false
		};
	},
	computed: {
		browser(): any {
			return this.$parent;
		},
		thumbnail(): any {
			return {
				'background-color': this.file.properties.avgColor && this.file.properties.avgColor.length == 3 ? `rgb(${this.file.properties.avgColor.join(',')})` : 'transparent',
				'background-image': `url(${this.file.thumbnailUrl})`
			};
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


root(isDark)
	display block
	text-decoration none !important

	*
		user-select none
		pointer-events none

	> .container
		max-width 500px
		margin 0 auto
		padding 16px

		&:after
			content ""
			display block
			clear both

		> .thumbnail
			display block
			float left
			width 64px
			height 64px
			background-size cover
			background-position center center

		> .body
			display block
			float left
			width calc(100% - 74px)
			margin-left 10px

			> .name
				display block
				margin 0
				padding 0
				font-size 0.9em
				font-weight bold
				color isDark ? #fff : #555
				text-overflow ellipsis
				overflow-wrap break-word

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

				> .separator
					padding 0 4px

				> .type
					color #9D9D9D

					> .mk-file-type-icon
						margin-right 4px

				> .data-size
					color #9D9D9D

				> .created-at
					color #BDBDBD

					> [data-fa]
						margin-right 2px

				> .nsfw
					color #bf4633

	&[data-is-selected]
		background var(--primary)

		&, *
			color #fff !important

.vupkuhvjnjyqaqhsiogfbywvjxynrgsm[data-darkmode]
	root(true)

.vupkuhvjnjyqaqhsiogfbywvjxynrgsm:not([data-darkmode])
	root(false)

</style>
