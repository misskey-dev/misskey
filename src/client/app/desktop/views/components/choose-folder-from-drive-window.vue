<template>
<mk-window ref="window" is-modal width="800px" height="500px" @closed="destroyDom">
	<template #header>
		<span>{{ $t('choose-prompt') }}</span>
	</template>

	<div class="hllkpxxu">
		<x-drive
			ref="browser"
			class="browser"
			:multiple="false"
		/>
		<div class="footer">
			<ui-button inline @click="cancel" style="margin-right:16px;">{{ $t('cancel') }}</ui-button>
			<ui-button inline @click="ok" primary>{{ $t('ok') }}</ui-button>
		</div>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
export default Vue.extend({
	i18n: i18n('desktop/views/components/choose-folder-from-drive-window.vue'),
	components: {
		XDrive: () => import('./drive.vue').then(m => m.default),
	},
	methods: {
		ok() {
			this.$emit('selected', (this.$refs.browser as any).folder);
			(this.$refs.window as any).close();
		},
		cancel() {
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.hllkpxxu
	display flex
	flex-direction column
	height 100%

	.browser
		flex 1
		overflow auto

	.footer
		padding 16px
		background var(--desktopPostFormBg)
		text-align right

</style>
