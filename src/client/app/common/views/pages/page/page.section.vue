<template>
<section class="sdgxphyu">
	<h1>{{ value.title }}</h1>

	<div class="children">
		<template v-for="child in value.children">
			<component :is="'x-' + child.type" :value="child" :root="root" :key="child.id"/>
		</template>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XText from './page.text.vue';
import XImage from './page.image.vue';
import XButton from './page.button.vue';

export default Vue.extend({
	components: {
		XText, XImage, XButton
	},

	props: {
		value: {
			required: true
		},
		root: {
			required: true
		}
	},

	data() {
		return {
			faStickyNote, faPlus, faPencilAlt
		};
	},

	beforeCreate() {
		this.$options.components.XSection = require('./page.section.vue').default;
	},
});
</script>

<style lang="stylus" scoped>
.sdgxphyu
	> .children
		padding 16px

</style>
