<template>
<transition :name="$store.state.animation ? 'zoom' : ''" appear>
	<div class="mjndxjch">
		<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
		<p><b><i class="fas fa-exclamation-triangle"></i> {{ $ts.pageLoadError }}</b></p>
		<p>{{ $ts.pageLoadErrorDescription }}</p>
		<p><MkA to="/docs/general/troubleshooting" class="_link">{{ $ts.troubleshooting }}</MkA></p>
		<p v-if="error" class="error">ERROR: {{ error }}</p>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
	},
	props: {
		error: {
			required: false,
		}
	},
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.error,
				icon: 'fas fa-exclamation-triangle'
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.mjndxjch {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 12px 0;
	}

	> .button {
		margin: 0 auto;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 24px;
		border-radius: 16px;
	}

	> .error {
		opacity: 0.7;
	}
}
</style>
