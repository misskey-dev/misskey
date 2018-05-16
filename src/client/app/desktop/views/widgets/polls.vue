<template>
<div class="mkw-polls">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:chart-pie%%i18n:@title%</template>
		<button slot="func" title="%i18n:@refresh%" @click="fetch">%fa:sync%</button>

		<div class="mkw-polls--body" :data-darkmode="_darkmode_">
			<div class="poll" v-if="!fetching && poll != null">
				<p v-if="poll.text"><router-link to="poll | notePage">{{ poll.text }}</router-link></p>
				<p v-if="!poll.text"><router-link to="poll | notePage">%fa:link%</router-link></p>
				<mk-poll :note="poll"/>
			</div>
			<p class="empty" v-if="!fetching && poll == null">%i18n:@nothing%</p>
			<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'polls',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			poll: null,
			fetching: true,
			offset: 0
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},
		fetch() {
			this.fetching = true;
			this.poll = null;

			(this as any).api('notes/polls/recommendation', {
				limit: 1,
				offset: this.offset
			}).then(notes => {
				const poll = notes ? notes[0] : null;
				if (poll == null) {
					this.offset = 0;
				} else {
					this.offset++;
				}
				this.poll = poll;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	> .poll
		padding 16px
		font-size 12px
		color isDark ? #9ea4ad : #555

		> p
			margin 0 0 8px 0

			> a
				color inherit

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

.mkw-polls--body[data-darkmode]
	root(true)

.mkw-polls--body:not([data-darkmode])
	root(false)

</style>
