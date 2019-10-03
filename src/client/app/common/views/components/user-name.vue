<template>
<mfm :text="user.name || user.username" :class="{ premium: user.isPremium }" :plain="true" :nowrap="nowrap" :custom-emojis="user.emojis"/>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		user: {
			type: Object,
			required: true
		},
		nowrap: {
			type: Boolean,
			default: true
		},
	}
});
</script>

<style lang="stylus" scoped>
	.premium {
		color #FFCA28
		text-shadow 0 0 1px #000
	}
</style>
