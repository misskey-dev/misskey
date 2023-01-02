<template>
<DesignB/>
<XCommon/>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import DesignA from './visitor/a.vue';
import DesignB from './visitor/b.vue';
import XCommon from './_common_/common.vue';

export default defineComponent({
	components: {
		XCommon,
		DesignA,
		DesignB,
	},
});
</script>
