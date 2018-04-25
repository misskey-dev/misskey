<template>
<mk-window ref="window" is-modal width="500px" height="550px" @closed="$destroy">
	<span slot="header">%fa:list% リスト</span>

	<button class="ui" @click="add">リストを作成</button>
	<router-link v-for="list in lists" :key="list.id" :to="`/i/lists/${list.id}`">{{ list.title }}</router-link>
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
		add() {
			(this as any).apis.input({
				title: 'リスト名',
			}).then(async title => {
				const list = await (this as any).api('users/lists/create', {
					title
				});

				this.$router.push(`i/lists/${ list.id }`);
			});
		},
		close() {
			(this as any).$refs.window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>

</style>
