<template>
<mk-ui :func="fn">
	<span slot="header">%fa:home%%i18n:mobile.tags.mk-home.home%</span>
	<template slot="funcIcon">%fa:pencil-alt%</template>
	<mk-home @loaded="onHomeLoaded"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';
import getPostSummary from '../../../../../common/get-post-summary';

export default Vue.extend({
	data() {
		return {
			connection: null,
			connectionId: null,
			unreadCount: 0
		};
	},
	mounted() {
		document.title = 'Misskey';
		document.documentElement.style.background = '#313a42';

		this.connection = (this as any).os.stream.getConnection();
		this.connectionId = (this as any).os.stream.use();

		this.connection.on('post', this.onStreamPost);
		document.addEventListener('visibilitychange', this.onVisibilitychange, false);

		Progress.start();
	},
	beforeDestroy() {
		this.connection.off('post', this.onStreamPost);
		(this as any).os.stream.dispose(this.connectionId);
		document.removeEventListener('visibilitychange', this.onVisibilitychange);
	},
	methods: {
		fn() {
			(this as any).apis.post();
		},
		onHomeLoaded() {
			Progress.done();
		},
		onStreamPost(post) {
			if (document.hidden && post.user_id !== (this as any).os.i.id) {
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
