<template>
<a class="root folder" @click.prevent="onClick" :href="`/i/drive/folder/${ folder.id }`">
	<div class="container">
		<p class="name">%fa:folder%{{ folder.name }}</p>%fa:angle-right%
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['folder'],
	computed: {
		browser(): any {
			return this.$parent;
		}
	},
	methods: {
		onClick() {
			this.browser.cd(this.folder);
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.folder
	display block
	color #777
	text-decoration none !important

	*
		user-select none
		pointer-events none

	> .container
		max-width 500px
		margin 0 auto
		padding 16px

		> .name
			display block
			margin 0
			padding 0

			> [data-fa]
				margin-right 6px

		> [data-fa]
			position absolute
			top 0
			bottom 0
			right 20px

			> *
				height 100%

</style>
