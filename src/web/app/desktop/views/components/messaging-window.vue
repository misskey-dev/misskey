<template>
<mk-window ref="window" width='500px' height='560px' @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:comments%メッセージ</span>
	<mk-messaging :class="$style.content" @navigate="navigate"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	methods: {
		navigate(user) {
			document.body.appendChild(new MkMessagingRoomWindow({
				parent: this,
				propsData: {
					user: user
				}
			}).$mount().$el);
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>
