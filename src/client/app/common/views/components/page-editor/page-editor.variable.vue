<template>
<x-container @remove="() => $emit('remove')" v-if="x.type === 'expression'">
	<template #header><fa :icon="faSuperscript"/> {{ x.name }}</template>

	<section class="oenmsdfp">
		<span>=</span>
		<input v-model="x.value"/>
	</section>
</x-container>

<x-v v-else v-model="x" :title="x.name" :removable="true" @remove="() => $emit('remove')" :ai-script="aiScript"/>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faSuperscript, faPencilAlt, faAlignLeft, faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import XContainer from './page-editor.container.vue';
import XV from './page-editor.variable.core.vue';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer, XV
	},

	props: {
		x: {
			required: true
		},
		aiScript: {
			required: true,
		}
	},

	data() {
		return {
			faSuperscript, faPencilAlt
		};
	},

	created() {
		if (this.x.value == null) Vue.set(this.x, 'value', '');
	},
});
</script>

<style lang="stylus" scoped>
.oenmsdfp
	> *
		padding 16px
		line-height 16px
		font-size 16px
		height 48px

	> span
		position absolute
		top 0
		left 0
		z-index 2
		pointer-events none

	> input
		display block
		-webkit-appearance none
		-moz-appearance none
		appearance none
		width 100%
		min-width 100%
		border none
		box-shadow none
		padding-left 38px

</style>
