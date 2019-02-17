<template>
<div class="mkw-trends">
	<ui-container :show-header="!props.compact">
		<template slot="header"><fa icon="fire"/>{{ $t('title') }}</template>
		<button slot="func" :title="$t('title')" @click="fetch"><fa icon="sync"/></button>

		<div class="mkw-trends--body">
			<p class="fetching" v-if="fetching"><fa icon="spinner" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
			<div class="note" v-else-if="note != null">
				<p class="text"><router-link :to="note | notePage">{{ note.text }}</router-link></p>
				<p class="author">―<router-link :to="note.user | userPage">@{{ note.user | acct }}</router-link></p>
			</div>
			<p class="empty" v-else>{{ $t('nothing') }}</p>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'trends',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n('desktop/views/widgets/trends.vue'),
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

			this.$root.api('notes/trend', {
				limit: 1,
				offset: this.offset,
				renote: false,
				reply: false,
				file: false,
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
.mkw-trends
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
			color var(--text)

		> .fetching
			margin 0
			padding 16px
			text-align center
			color var(--text)

			> [data-icon]
				margin-right 4px

</style>
