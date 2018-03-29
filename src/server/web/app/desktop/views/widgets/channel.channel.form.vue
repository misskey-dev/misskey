<template>
<div class="form">
	<input v-model="text" :disabled="wait" @keydown="onKeydown" placeholder="書いて">
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			text: '',
			wait: false
		};
	},
	methods: {
		onKeydown(e) {
			if (e.which == 10 || e.which == 13) this.post();
		},
		post() {
			this.wait = true;

			let reply = null;

			if (/^>>([0-9]+) /.test(this.text)) {
				const index = this.text.match(/^>>([0-9]+) /)[1];
				reply = (this.$parent as any).posts.find(p => p.index.toString() == index);
				this.text = this.text.replace(/^>>([0-9]+) /, '');
			}

			(this as any).api('posts/create', {
				text: this.text,
				replyId: reply ? reply.id : undefined,
				channelId: (this.$parent as any).channel.id
			}).then(data => {
				this.text = '';
			}).catch(err => {
				alert('失敗した');
			}).then(() => {
				this.wait = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.form
	width 100%
	height 38px
	padding 4px
	border-top solid 1px #ddd

	> input
		padding 0 8px
		width 100%
		height 100%
		font-size 14px
		color #55595c
		border solid 1px #dadada
		border-radius 4px

		&:hover
		&:focus
			border-color #aeaeae

</style>
