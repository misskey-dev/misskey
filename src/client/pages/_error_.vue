<template>
<transition :name="$store.state.device.animation ? 'zoom' : ''" appear>
	<div class="_section">
		<div class="mjndxjch _content">
			<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
			<p><Fa :icon="faExclamationTriangle"/> {{ $t('pageLoadError') }}</p>
			<p>{{ $t('pageLoadErrorDescription') }}</p>
		</div>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
	},
	data() {
		return {
			INFO: {
				title: this.$t('error'),
				icon: faExclamationTriangle
			},
			faExclamationTriangle
		};
	},
});
</script>

<style lang="scss" scoped>
.mjndxjch {
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
