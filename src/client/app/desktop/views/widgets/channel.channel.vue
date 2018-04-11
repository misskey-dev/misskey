<template>
<div class="channel">
	<p v-if="fetching">読み込み中<mk-ellipsis/></p>
	<div v-if="!fetching" ref="notes" class="notes">
		<p v-if="notes.length == 0">まだ投稿がありません</p>
		<x-note class="note" v-for="note in notes.slice().reverse()" :note="note" :key="note.id" @reply="reply"/>
	</div>
	<x-form class="form" ref="form"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import ChannelStream from '../../../common/scripts/streaming/channel';
import XForm from './channel.channel.form.vue';
import XNote from './channel.channel.note.vue';

export default Vue.extend({
	components: {
		XForm,
		XNote
	},
	props: ['channel'],
	data() {
		return {
			fetching: true,
			notes: [],
			connection: null
		};
	},
	watch: {
		channel() {
			this.zap();
		}
	},
	mounted() {
		this.zap();
	},
	beforeDestroy() {
		this.disconnect();
	},
	methods: {
		zap() {
			this.fetching = true;

			(this as any).api('channels/notes', {
				channelId: this.channel.id
			}).then(notes => {
				this.notes = notes;
				this.fetching = false;

				this.$nextTick(() => {
					this.scrollToBottom();
				});

				this.disconnect();
				this.connection = new ChannelStream((this as any).os, this.channel.id);
				this.connection.on('note', this.onNote);
			});
		},
		disconnect() {
			if (this.connection) {
				this.connection.off('note', this.onNote);
				this.connection.close();
			}
		},
		onNote(note) {
			this.notes.unshift(note);
			this.scrollToBottom();
		},
		scrollToBottom() {
			(this.$refs.notes as any).scrollTop = (this.$refs.notes as any).scrollHeight;
		},
		reply(note) {
			(this.$refs.form as any).text = `>>${ note.index } `;
		}
	}
});
</script>

<style lang="stylus" scoped>
.channel

	> p
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .notes
		height calc(100% - 38px)
		overflow auto
		font-size 0.9em

		> .note
			border-bottom solid 1px #eee

			&:last-child
				border-bottom none

	> .form
		position absolute
		left 0
		bottom 0

</style>
