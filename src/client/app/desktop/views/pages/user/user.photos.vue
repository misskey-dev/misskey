<template>
<div class="dzsuvbsrrrwobdxifudxuefculdfiaxd">
	<p class="title">%fa:camera%%i18n:@title%</p>
	<p class="initializing" v-if="fetching">%fa:spinner .pulse .fw%%i18n:@loading%<mk-ellipsis/></p>
	<div class="stream" v-if="!fetching && images.length > 0">
		<div v-for="image in images" class="img"
			:style="`background-image: url(${image.thumbnailUrl})`"
		></div>
	</div>
	<p class="empty" v-if="!fetching && images.length == 0">%i18n:@no-photos%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['user'],
	data() {
		return {
			images: [],
			fetching: true
		};
	},
	mounted() {
		(this as any).api('users/notes', {
			userId: this.user.id,
			withFiles: true,
			limit: 9
		}).then(notes => {
			notes.forEach(note => {
				note.files.forEach(file => {
					if (this.images.length < 9) this.images.push(file);
				});
			});
			this.fetching = false;
		});
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	background isDark ? #282C37 : #fff
	box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)
	overflow hidden

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		background: isDark ? #313543 : inherit
		color isDark ? #e3e5e8 : #888
		box-shadow 0 1px rgba(#000, 0.07)

		> i
			margin-right 4px

	> .stream
		display -webkit-flex
		display -moz-flex
		display -ms-flex
		display flex
		justify-content center
		flex-wrap wrap
		padding 8px

		> .img
			flex 1 1 33%
			width 33%
			height 80px
			background-position center center
			background-size cover
			background-clip content-box
			border solid 2px transparent

	> .initializing
	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

		> i
			margin-right 4px

.dzsuvbsrrrwobdxifudxuefculdfiaxd[data-darkmode]
	root(true)

.dzsuvbsrrrwobdxifudxuefculdfiaxd:not([data-darkmode])
	root(false)

</style>
