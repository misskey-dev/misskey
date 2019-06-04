<template>
<div class="mk-drive-folder-chooser">
	<div class="body">
		<header>
			<h1>{{ $t('select-folder') }}</h1>
			<button class="close" @click="cancel"><fa icon="times"/></button>
			<button class="ok" @click="ok"><fa icon="check"/></button>
		</header>
		<x-drive ref="browser"
			select-folder
		/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n('mobile/views/components/drive-folder-chooser.vue'),
	components: {
		XDrive: () => import('./drive.vue').then(m => m.default),
	},
	methods: {
		cancel() {
			this.$emit('canceled');
			this.destroyDom();
		},
		ok() {
			this.$emit('selected', (this.$refs.browser as unknown).folder);
			this.destroyDom();
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
	background rgba(#000, 0.2)

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
