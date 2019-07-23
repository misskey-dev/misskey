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
			<div class="body" v-if="!isSetting" v-html="props.html"></div>
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
		input[type=text]
				margin 0
				padding 0
				font inherit
				font-size 12px
				line-height 32px
				color var(--inputText)
				background var(--face)
				border 0
				border-bottom solid var(--lineWidth) var(--faceDivider)
				border-radius 0
				outline none
				box-shadow none
	.mkw-html--body
		> textarea
			display block
			width 100%
			max-width 100%
			min-width 100%
			font-size 16px
			height: 300px
			padding 16px
			color var(--inputText)
			background var(--face)
			border none
			border-bottom solid var(--lineWidth) var(--faceDivider)
			border-radius 0
		.body
			display block
			padding 16px
			background #fafafa
			color #202020


</style>
