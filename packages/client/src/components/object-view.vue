<template>
<div class="zhyxdalp">
	<XValue :value="value" :collapsed="false"/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XValue from './object-view.value.vue';

export default defineComponent({
	components: {
		XValue
	},

	props: {
		value: {
			type: Object,
			required: true,
		},
	},

	setup(props) {

	}
});
</script>

<style lang="scss" scoped>
.zhyxdalp {

}
</style>
