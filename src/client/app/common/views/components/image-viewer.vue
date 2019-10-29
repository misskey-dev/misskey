<template>
<ui-modal ref="modal" v-hotkey.global="keymap">
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close" />
</ui-modal>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['image'],
	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		}
	},
	methods: {
		close() {
			(this.$refs.modal as any).close();
		}
	}
});
</script>

<style lang="stylus" scoped>
img
	position fixed
	z-index 2
	top 0
	right 0
	bottom 0
	left 0
	max-width 100%
	max-height 100%
	margin auto
	cursor zoom-out
	image-orientation from-image

</style>
