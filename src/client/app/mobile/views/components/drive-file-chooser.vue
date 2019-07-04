<template>
<div class="cdxzvcfawjxdyxsekbxbfgtplebnoneb">
	<div class="body">
		<header>
			<h1>{{ $t('select-file') }}<span class="count" v-if="files.length > 0">({{ files.length }})</span></h1>
			<button class="close" @click="cancel"><fa icon="times"/></button>
			<button v-if="multiple" class="ok" @click="ok"><fa icon="check"/></button>
		</header>
		<x-drive class="drive" ref="browser"
			:select-file="true"
			:type="type"
			:multiple="multiple"
			@change-selection="onChangeSelection"
			@selected="onSelected"
		/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/components/drive-file-chooser.vue'),
	components: {
		XDrive: () => import('./drive.vue').then(m => m.default),
	},
	props: ['type', 'multiple'],
	data() {
		return {
			files: []
		};
	},
	methods: {
		onChangeSelection(files) {
			this.files = files;
		},
		onSelected(file) {
			this.$emit('selected', file);
			this.destroyDom();
		},
		cancel() {
			this.$emit('canceled');
			this.destroyDom();
		},
		ok() {
			this.$emit('selected', this.files);
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" scoped>
.cdxzvcfawjxdyxsekbxbfgtplebnoneb
	position fixed
	z-index 20000
	top 0
	left 0
	width 100%
	height 100%
	padding 8px
	background rgba(#000, 0.2)

	> .body
		width 100%
		height 100%
		background var(--faceHeader)

		> header
			border-bottom solid 1px var(--faceDivider)
			color var(--text)

			> h1
				margin 0
				padding 0
				text-align center
				line-height 42px
				font-size 1em
				font-weight normal

				> .count
					margin-left 4px
					opacity 0.5

			> .close
				position absolute
				top 0
				left 0
				line-height 42px
				width 42px

			> .ok
				position absolute
				top 0
				right 0
				line-height 42px
				width 42px

		> .drive
			height calc(100% - 42px)
			overflow scroll
			-webkit-overflow-scrolling touch

</style>
