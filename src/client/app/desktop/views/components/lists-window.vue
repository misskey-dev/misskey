<template>
<mk-window ref="window" is-modal width="500px" height="550px" @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:list% リスト</span>

	<button class="ui">リストを作成</button>
	<a v-for="list in lists" :key="list.id">

	</a>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			fetching: true,
			lists: []
		};
	},
	mounted() {
		(this as any).api('users/lists/list').then(lists => {
			this.fetching = false;
			this.lists = lists;
		});
	},
	methods: {
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>

</style>
