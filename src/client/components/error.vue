<template>
<transition :name="$store.state.device.animation ? 'zoom' : ''" appear>
	<div class="mjndxjcg">
		<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
		<p><Fa :icon="faExclamationTriangle"/> {{ $t('error') }}</p>
		<MkButton @click="() => $emit('retry')" class="button">{{ $t('retry') }}</MkButton>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from './ui/button.vue';
import * as os from '@/os';

export default defineComponent({
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
