<template>
<div class="_formItem" v-if="pending">
	<div class="_formPanel">
		pending
	</div>
</div>
<slot v-else-if="resolved" :result="result"></slot>
<div class="_formItem" v-else>
	<div class="_formPanel">
		error!
		<button @click="retry">retry</button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch } from 'vue';
import './form.scss';

export default defineComponent({
	props: {
		p: {
			type: Function as PropType<() => Promise<any>>,
			required: true,
		}
	},

	setup(props, context) {
		const pending = ref(true);
		const resolved = ref(false);
		const rejected = ref(false);
		const result = ref(null);

		const process = () => {
			if (props.p == null) {
				return;
			}
			const promise = props.p();
			pending.value = true;
			resolved.value = false;
			rejected.value = false;
			promise.then((_result) => {
				pending.value = false;
				resolved.value = true;
				result.value = _result;
			});
			promise.catch(() => {
				pending.value = false;
				rejected.value = true;
			});
		};

		watch(() => props.p, () => {
			process();
		}, {
			immediate: true
		});

		const retry = () => {
			process();
		};

		return {
			pending,
			resolved,
			rejected,
			result,
			retry,
		};
	}
});
</script>

<style lang="scss" scoped>

</style>
