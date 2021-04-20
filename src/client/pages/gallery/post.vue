<template>
<div class="rkxwuolj _root">
	<transition name="fade" mode="out-in">
		<div v-if="post" class="post">
		</div>
		<MkError v-else-if="error" @retry="fetch()"/>
		<MkLoading v-else/>
	</transition>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
	},
	props: {
		postId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.post ? {
				title: this.post.title,
				avatar: this.post.user,
				path: `/gallery/${this.post.id}`,
				share: {
					title: this.post.title,
					text: this.note.description,
				},
			} : null),
			post: null,
			error: null,
		};
	},
	watch: {
		postId: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.post = null;
			os.api('gallery/posts/show', {
				postId: this.postId
			}).then(post => {
				this.post = post;
			}).catch(e => {
				this.error = e;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.rkxwuolj {

}
</style>
