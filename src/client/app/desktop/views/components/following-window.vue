<template>
<mk-window width="400px" height="550px" @closed="$destroy">
	<span slot="header" :class="$style.header">
		<img :src="`${user.avatarUrl}?thumbnail&size=64`" alt=""/>%i18n:@following%.replace('{}', {{ user | userName }})
	</span>
	<mk-following :user="user"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user']
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
