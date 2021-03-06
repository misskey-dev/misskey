<template>
<div class="xfbouadm" v-if="meta" :style="{ backgroundImage: `url(${ meta.backgroundImageUrl })` }">

</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	components: {
	},

	data() {
		return {
			meta: null,
		};
	},

	created() {
		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
		});
	},
});
</script>

<style lang="scss" scoped>
.xfbouadm {
	background-position: center;
	background-size: cover;
}
</style>
