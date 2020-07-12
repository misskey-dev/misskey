<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faAlignLeft"/> {{ $t('_pages.blocks.text') }}</template>

	<section class="vckmsadr">
		<textarea v-model="value.text"></textarea>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';

export default Vue.extend({
	components: {
		XContainer
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			faAlignLeft,
		};
	},

	created() {
		if (this.value.text == null) Vue.set(this.value, 'text', '');
	},
});
</script>

<style lang="scss" scoped>
.vckmsadr {
	> textarea {
		display: block;
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		width: 100%;
		min-width: 100%;
		min-height: 150px;
		border: none;
		box-shadow: none;
		padding: 16px;
		background: transparent;
		color: var(--fg);
		font-size: 14px;
		box-sizing: border-box;
	}
}
</style>
