<template>
<section class="sdgxphyu">
	<component :is="'h' + h">{{ value.title }}</component>

	<div class="children">
		<template v-for="child in value.children">
			<component :is="'x-' + child.type" :value="child" :page="page" :script="script" :key="child.id" :h="h + 1"/>
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
		script: {
			required: true
		},
		page: {
			required: true
		},
		h: {
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
	margin 1.5em 0

	> h2
		font-size 24px
		margin 0 0 0.5em 0

	> .children
		//padding 16px

</style>
