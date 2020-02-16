<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }">
	<img class="xubzgfga" ref="img" :src="image.url" :alt="image.name" :title="image.name" @click="close" tabindex="-1"/>
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XModal from './modal.vue';

export default Vue.extend({
	i18n,

	components: {
		XModal,
	},

	props: {
		image: {
			type: Object,
			required: true
		},
	},

	mounted() {
		this.$nextTick(() => {
			this.$refs.img.focus();
		});
	},

	methods: {
		close() {
			this.$refs.modal.close();
		},
	}
});
</script>

<style lang="scss" scoped>
.xubzgfga {
	position: fixed;
	z-index: 2;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	max-width: 100%;
	max-height: 100%;
	margin: auto;
	cursor: zoom-out;
	image-orientation: from-image;
}
</style>
