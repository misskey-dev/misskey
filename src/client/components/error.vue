<template>
<transition :name="$store.state.device.animation ? 'zoom' : ''" appear>
	<div class="mjndxjcg _panel">
		<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
		<p><fa :icon="faExclamationTriangle"/> {{ $t('error') }}</p>
		<mk-button @click="() => $emit('retry')" class="button">{{ $t('retry') }}</mk-button>
	</div>
</transition>
</template>

<script lang="ts">
import Vue from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from './ui/button.vue';

export default Vue.extend({
	components: {
		MkButton,
	},
	data() {
		return {
			faExclamationTriangle
		};
	},
});
</script>

<style lang="scss" scoped>
.mjndxjcg {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 8px 0;
	}

	> .button {
		margin: 0 auto;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 16px;
		border-radius: 16px;
	}
}
</style>
