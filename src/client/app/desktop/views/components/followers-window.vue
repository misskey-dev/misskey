<template>
<mk-window width="400px" height="550px" @closed="$destroy">
	<span slot="header" :class="$style.header">
		<img :src="`${user.avatarUrl}?thumbnail&size=64`" alt=""/>{{ name }}のフォロワー
	</span>
	<mk-followers :user="user"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import getUserName from '../../../../../renderers/get-user-name';

export default Vue.extend({
	props: ['user'],
	computed {
		name() {
			return getUserName(this.user);
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> img
		display inline-block
		vertical-align bottom
		height calc(100% - 10px)
		margin 5px
		border-radius 4px

</style>
