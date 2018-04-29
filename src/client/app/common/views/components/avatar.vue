<template>
	<router-link class="mk-avatar" :to="user | userPage" :title="user | acct" :target="target" :style="{ borderRadius: clientSettings.circleIcons ? '100%' : null }">
		<img v-if="disablePreview" :src="`${user.avatarUrl}?thumbnail&size=128`" alt=""/>
		<img v-else :src="`${user.avatarUrl}?thumbnail&size=128`" alt="" v-user-preview="user.id"/>
	</router-link>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		user: {
			required: true
		},
		target: {
			required: false,
			default: null
		},
		disablePreview: {
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-avatar
	display block

	> img
		display inline-block
		width 100%
		height 100%
		margin 0
		border-radius inherit
		vertical-align bottom
</style>
