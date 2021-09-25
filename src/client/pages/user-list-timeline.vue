<template>
<div class="eqqrhokj" v-hotkey.global="keymap" v-size="{ min: [800] }">
	<div class="new" v-if="queue > 0"><button class="_buttonPrimary" @click="top()">{{ $ts.newNoteRecived }}</button></div>
	<div class="tl _block">
		<XTimeline ref="tl" class="tl"
			:key="listId"
			src="list"
			:list="listId"
			:sound="true"
			@before="before()"
			@after="after()"
			@queue="queueUpdated"
		/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, computed } from 'vue';
import Progress from '@client/scripts/loading';
import XTimeline from '@client/components/timeline.vue';
import { scroll } from '@client/scripts/scroll';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		XTimeline,
	},

	props: {
		listId: {
			type: String,
			required: true
		}
	},

	data() {
		return {
			list: null,
			queue: 0,
			[symbols.PAGE_INFO]: computed(() => this.list ? {
				title: this.list.name,
				icon: 'fas fa-list-ul',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-calendar-alt',
					text: this.$ts.jumpToSpecifiedDate,
					handler: this.timetravel
				}, {
					icon: 'fas fa-cog',
					text: this.$ts.settings,
					handler: this.settings
				}],
			} : null),
		};
	},

	computed: {
		keymap(): any {
			return {
				't': this.focus
			};
		},
	},

	watch: {
		listId: {
			async handler() {
				this.list = await os.api('users/lists/show', {
					listId: this.listId
				});
			},
			immediate: true
		}
	},

	methods: {
		before() {
			Progress.start();
		},

		after() {
			Progress.done();
		},

		queueUpdated(q) {
			this.queue = q;
		},

		top() {
			scroll(this.$el, 0);
		},

		settings() {
			this.$router.push(`/my/lists/${this.listId}`);
		},

		async timetravel() {
			const { canceled, result: date } = await os.dialog({
				title: this.$ts.date,
				input: {
					type: 'date'
				}
			});
			if (canceled) return;

			this.$refs.tl.timetravel(new Date(date));
		},

		focus() {
			(this.$refs.tl as any).focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.eqqrhokj {
	padding: var(--margin);

	> .new {
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 16px);
		z-index: 1000;
		width: 100%;

		> button {
			display: block;
			margin: var(--margin) auto 0 auto;
			padding: 8px 16px;
			border-radius: 32px;
		}
	}

	> .tl {
		background: var(--bg);
		border-radius: var(--radius);
		overflow: clip;
	}

	&.min-width_800px {
		max-width: 800px;
		margin: 0 auto;
	}
}
</style>
