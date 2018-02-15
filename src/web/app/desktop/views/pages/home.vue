<template>
<mk-ui>
	<mk-home :mode="mode"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import getPostSummary from '../../../../../common/get-post-summary';

export default Vue.extend({
	props: {
		mode: {
			type: String,
			default: 'timeline'
		}
	},
	data() {
		return {
			connection: null,
			connectionId: null,
			unreadCount: 0
		};
	},
	mounted() {
		document.title = 'Misskey';

		this.connection = this.$root.$data.os.stream.getConnection();
		this.connectionId = this.$root.$data.os.stream.use();

		this.connection.on('post', this.onStreamPost);
		document.addEventListener('visibilitychange', this.onVisibilitychange, false);

		Progress.start();
	},
	beforeDestroy() {
		this.connection.off('post', this.onStreamPost);
		this.$root.$data.os.stream.dispose(this.connectionId);
		document.removeEventListener('visibilitychange', this.onVisibilitychange);
	},
	methods: {
		onStreamPost(post) {
			if (document.hidden && post.user_id != this.$root.$data.os.i.id) {
				this.unreadCount++;
				document.title = `(${this.unreadCount}) ${getPostSummary(post)}`;
			}
		},

		onVisibilitychange() {
			if (!document.hidden) {
				this.unreadCount = 0;
				document.title = 'Misskey';
			}
		}
	}
});
</script>
