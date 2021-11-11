<template>
<div class="geegznzt">
	<XAntenna :antenna="draft" @created="onAntennaCreated"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import XAntenna from './editor.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
		XAntenna,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.manageAntennas,
				icon: 'fas fa-satellite',
			},
			draft: {
				name: '',
				src: 'all',
				userListId: null,
				userGroupId: null,
				users: [],
				keywords: [],
				excludeKeywords: [],
				withReplies: false,
				caseSensitive: false,
				withFile: false,
				notify: false
			},
		};
	},

	methods: {
		onAntennaCreated() {
			this.$router.push('/my/antennas');
		},
	}
});
</script>

<style lang="scss" scoped>

</style>
