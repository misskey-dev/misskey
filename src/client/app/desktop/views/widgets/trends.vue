<template>
<div class="mkw-trends">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:fire%%i18n:@title%</template>
		<button slot="func" title="%i18n:@refresh%" @click="fetch">%fa:sync%</button>

		<div class="mkw-trends--body">
			<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
			<div class="note" v-else-if="note != null">
				<p class="text"><router-link :to="note | notePage">{{ note.text }}</router-link></p>
				<p class="author">―<router-link :to="note.user | userPage">@{{ note.user | acct }}</router-link></p>
			</div>
			<p class="empty" v-else>%i18n:@nothing%</p>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'trends',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			note: null,
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
			this.note = null;

			(this as any).api('notes/trend', {
				limit: 1,
				offset: this.offset,
				renote: false,
				reply: false,
				media: false,
				poll: false
			}).then(notes => {
				const note = notes ? notes[0] : null;
				if (note == null) {
					this.offset = 0;
				} else {
					this.offset++;
				}
				this.note = note;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	.mkw-trends--body
		> .note
			padding 16px
			font-size 12px
			font-style oblique
			color #555

			> p
				margin 0

			> .text,
			> .author
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

.mkw-trends[data-darkmode]
	root(true)

.mkw-trends:not([data-darkmode])
	root(false)

</style>
