<template>
<div class="dnpfarvgbnfmyzbdquhhzyxcmstpdqzs" :class="{ naked, narrow, isActive, isStacked }">
	<header :class="{ indicate }" @click="toggleActive">
		<slot name="header"></slot>
		<button ref="menu" @click.stop="showMenu">%fa:caret-down%</button>
	</header>
	<div ref="body" v-show="isActive">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Menu from '../../../../common/views/components/menu.vue';

export default Vue.extend({
	props: {
		name: {
			type: String,
			required: false
		},
		menu: {
			type: Array,
			required: false,
			default: null
		},
		naked: {
			type: Boolean,
			required: false,
			default: false
		},
		narrow: {
			type: Boolean,
			required: false,
			default: false
		}
	},

	inject: {
		column: { from: 'column' },
		_isActive: { from: 'isActive' },
		isStacked: { from: 'isStacked' },
		getColumnVm: { from: 'getColumnVm' }
	},

	data() {
		return {
			indicate: false,
			isActive: this._isActive
		};
	},

	provide() {
		return {
			column: this,
			isScrollTop: this.isScrollTop,
			indicate: v => this.indicate = v
		};
	},

	mounted() {
		this.$refs.body.addEventListener('scroll', this.onScroll, { passive: true });
	},
	beforeDestroy() {
		this.$refs.body.removeEventListener('scroll', this.onScroll);
	},

	methods: {
		toggleActive() {
			if (!this.isStacked) return;
			const vms = this.$store.state.settings.deck.layout.find(ids => ids.indexOf(this.column.id) != -1).map(id => this.getColumnVm(id));
			if (this.isActive && vms.filter(vm => vm.$el.classList.contains('isActive')).length == 1) return;
			this.isActive = !this.isActive;
		},

		isScrollTop() {
			return this.$refs.body.scrollTop == 0;
		},

		onScroll() {
			if (this.isScrollTop()) {
				this.$emit('top');
			}

			if (this.$store.state.settings.fetchOnScroll !== false) {
				const current = this.$refs.body.scrollTop + this.$refs.body.clientHeight;
				if (current > this.$refs.body.scrollHeight - 1) this.$emit('bottom');
			}
		},

		showMenu() {
			const items = [{
				content: '%fa:pencil-alt% %i18n:common.deck.rename%',
				onClick: () => {
					(this as any).apis.input({
						title: '%i18n:common.deck.rename%',
						default: this.name,
						allowEmpty: false
					}).then(name => {
						this.$store.dispatch('settings/renameDeckColumn', { id: this.column.id, name });
					});
				}
			}, null, {
				content: '%fa:arrow-left% %i18n:common.deck.swap-left%',
				onClick: () => {
					this.$store.dispatch('settings/swapLeftDeckColumn', this.column.id);
				}
			}, {
				content: '%fa:arrow-right% %i18n:common.deck.swap-right%',
				onClick: () => {
					this.$store.dispatch('settings/swapRightDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				content: '%fa:arrow-up% %i18n:common.deck.swap-up%',
				onClick: () => {
					this.$store.dispatch('settings/swapUpDeckColumn', this.column.id);
				}
			} : undefined, this.isStacked ? {
				content: '%fa:arrow-down% %i18n:common.deck.swap-down%',
				onClick: () => {
					this.$store.dispatch('settings/swapDownDeckColumn', this.column.id);
				}
			} : undefined, null, {
				content: '%fa:window-restore R% %i18n:common.deck.stack-left%',
				onClick: () => {
					this.$store.dispatch('settings/stackLeftDeckColumn', this.column.id);
				}
			}, this.isStacked ? {
				content: '%fa:window-restore R% %i18n:common.deck.pop-right%',
				onClick: () => {
					this.$store.dispatch('settings/popRightDeckColumn', this.column.id);
				}
			} : undefined, null, {
				content: '%fa:trash-alt R% %i18n:common.deck.remove%',
				onClick: () => {
					this.$store.dispatch('settings/removeDeckColumn', this.column.id);
				}
			}];

			if (this.menu) {
				items.unshift(null);
				this.menu.reverse().forEach(i => items.unshift(i));
			}

			this.os.new(Menu, {
				source: this.$refs.menu,
				compact: false,
				items
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	$header-height = 42px

	width 330px
	min-width 330px
	height 100%
	background isDark ? #282C37 : #fff
	border-radius 6px
	box-shadow 0 2px 16px rgba(#000, 0.1)
	overflow hidden

	&:not(.isActive)
		flex-basis $header-height
		min-height $header-height

	&:not(.isStacked).narrow
		width 285px
		min-width 285px

	&.naked
		background rgba(#000, isDark ? 0.25 : 0.1)

		> header
			background transparent
			box-shadow none

			if !isDark
				> button
					color #bbb

	> header
		z-index 1
		line-height $header-height
		padding 0 16px
		font-size 14px
		color isDark ? #e3e5e8 : #888
		background isDark ? #313543 : #fff
		box-shadow 0 1px rgba(#000, 0.15)

		&, *
			user-select none

		&.indicate
			box-shadow 0 3px 0 0 $theme-color

		> span
			[data-fa]
				margin-right 8px

		> button
			position absolute
			top 0
			right 0
			width $header-height
			line-height $header-height
			color isDark ? #9baec8 : #ccc

			&:hover
				color isDark ? #b2c1d5 : #aaa

			&:active
				color isDark ? #b2c1d5 : #999

	> div
		height "calc(100% - %s)" % $header-height
		overflow auto
		overflow-x hidden

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs[data-darkmode]
	root(true)

.dnpfarvgbnfmyzbdquhhzyxcmstpdqzs:not([data-darkmode])
	root(false)

</style>
