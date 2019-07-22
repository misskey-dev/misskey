<template>
<div class="mkw-html">
	<ui-container :show-header="!props.compact">
		<template #header>
			<fa icon="code"/>
			<span v-if="!isSetting">{{ props.title }}</span>
			<span v-else>
				<input type="text" v-model="title" :placeholder="$t('placeholder-title')"/>
			</span>
		</template>
		<template #func>
			<button title="設定" v-if="!isSetting" @click="beginSetting()"><fa icon="cog"/></button>
			<button title="done" v-else @click="endSetting()"><fa icon="check"/></button>
		</template>

		<div class="mkw-html--body" :data-mobile="platform == 'mobile'">
			<div v-if="!isSetting" v-html="props.html"></div>
			<textarea v-else v-model="html" :placeholder="$t('placeholder-html')"></textarea>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'html',
	props: () => ({
		compact: false,
		title: 'HTML Widget',
		html: '<h1>It works!</h1>',
	})
}).extend({
	i18n: i18n('common/views/widgets/html.vue'),
	data() {
		return {
			isSetting: false,
			title: '',
			html: '',
		};
	},
	mounted() {
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},
		beginSetting() {
			this.title = this.props.title;
			this.html = this.props.html;
			this.isSetting = true;
		},
		endSetting() {
			this.props.title = this.title;
			this.props.html = this.html;
			this.save();
			this.isSetting = false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-html
	.mkw-html--body
		.feed
			padding 12px 16px
			font-size 0.9em

			> a
				display block
				padding 4px 0
				color var(--text)
				border-bottom dashed var(--lineWidth) var(--faceDivider)
				white-space nowrap
				text-overflow ellipsis
				overflow hidden

				&:last-child
					border-bottom none

		.fetching
			margin 0
			padding 16px
			text-align center
			color var(--text)

			> [data-icon]
				margin-right 4px

		&[data-mobile]
			background var(--face)

			.feed
				padding 0

				> a
					padding 8px 16px
					border-bottom none

					&:nth-child(even)
						background rgba(#000, 0.05)

</style>
