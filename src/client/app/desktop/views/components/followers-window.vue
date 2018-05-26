<template>
<mk-window width="400px" height="550px" @closed="$destroy">
	<span slot="header" :class="$style.header">
		<img :src="`${user.avatarUrl}?thumbnail&size=64`" alt=""/>{{ '%i18n:@followers%'.replace('{}', name) }}
	</span>
	<mk-followers :user="user"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['user'],
	computed: {
		name(): string {
			return Vue.filter('userName')(this.user);
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
