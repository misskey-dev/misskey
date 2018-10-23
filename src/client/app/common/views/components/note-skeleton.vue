<template>
<div>
	<vue-content-loading v-if="width" :width="width" :height="100" :primary="primary" :secondary="secondary">
		<circle cx="30" cy="30" r="30" />
		<rect x="75" y="13" rx="4" ry="4" :width="150 + r1" height="15" />
		<rect x="75" y="39" rx="4" ry="4" :width="260 + r2" height="10" />
		<rect x="75" y="59" rx="4" ry="4" :width="230 + r3" height="10" />
	</vue-content-loading>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import VueContentLoading from 'vue-content-loading';
import * as tinycolor from 'tinycolor2';

export default Vue.extend({
	components: {
		VueContentLoading,
	},

	data() {
		return {
			width: 0,
			r1: (Math.random() * 100) - 50,
			r2: (Math.random() * 100) - 50,
			r3: (Math.random() * 100) - 50
		};
	},

	computed: {
		text(): tinycolor.Instance {
			const text = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--text'));
			return text;
		},

		primary(): string {
			return '#' + this.text.clone().toHex();
		},

		secondary(): string {
			return '#' + this.text.clone().darken(20).toHex();
		}
	},

	mounted() {
		let width = this.$el.clientWidth;
		if (width < 400) width = 400;
		this.width = width;
	}
});
</script>
