<template>
<div class="muteblockuser">
	<div class="avatar-link">
		<a :href="user | userPage(null, true)">
			<mk-avatar class="avatar" :user="user" :disable-link="true"/>
		</a>
	</div>
	<div class="text">
		<div><mk-user-name :user="user"/></div>
		<div class="username">@{{ user | acct }}</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/mute-and-block.user.vue'),
	props: ['user'],
});
</script>

<style lang="stylus" scoped>
.muteblockuser
	display flex
	padding 16px

	> .avatar-link
		> a
			> .avatar
				width 40px
				height 40px

	> .text
		color var(--text)
		margin-left 16px
</style>
