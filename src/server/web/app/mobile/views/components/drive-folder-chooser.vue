<template>
<div class="mk-drive-folder-chooser">
	<div class="body">
		<header>
			<h1>%i18n:mobile.tags.mk-drive-folder-selector.select-folder%</h1>
			<button class="close" @click="cancel">%fa:times%</button>
			<button class="ok" @click="ok">%fa:check%</button>
		</header>
		<mk-drive ref="browser"
			select-folder
		/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	methods: {
		cancel() {
			this.$emit('canceled');
			this.$destroy();
		},
		ok() {
			this.$emit('selected', (this.$refs.browser as any).folder);
			this.$destroy();
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-drive-folder-chooser
	position fixed
	z-index 2048
	top 0
	left 0
	width 100%
	height 100%
	padding 8px
	background rgba(0, 0, 0, 0.2)

	> .body
		width 100%
		height 100%
		background #fff

		> header
			border-bottom solid 1px #eee

			> h1
				margin 0
				padding 0
				text-align center
				line-height 42px
				font-size 1em
				font-weight normal

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

		> .mk-drive
			height calc(100% - 42px)
			overflow scroll
			-webkit-overflow-scrolling touch

</style>
