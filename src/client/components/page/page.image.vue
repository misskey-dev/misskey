<template>
<div class="lzyxtsnt">
	<img v-if="image" :src="image.url"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		value: {
			required: true
		},
		page: {
			required: true
		},
	},
	data() {
		return {
			image: null,
		};
	},
	created() {
		this.image = this.page.attachedFiles.find(x => x.id === this.value.fileId);

		if (typeof this.image === "undefined") {
			this.image = this.value;
		}
	}
});
</script>

<style lang="scss" scoped>
.lzyxtsnt {
	> img {
		max-width: 100%;
	}
}
</style>
