<template>
	<transition name="zoom-in-top">
		<div class="buebdbiu" ref="popover" v-if="show">
			<span v-if="users.length == 1">{{ users[0] }}</span>
			<span v-if="users.length == 2">{{ users[0] }} and {{ users[1] }}</span>
			<span v-if="3 <= users.length && users.length <= 10">{{ users.slice(0, users.length - 1).join(', ') }}, and {{ users[users.length - 1] }}</span>
			<span v-if="11 <= users.length">{{ users.slice(0, 10).join(', ') }}, and {{ users.length - 10 }} more</span>
			<span> reacted with </span>
			<mk-reaction-icon :reaction="reaction" ref="icon"/>
			<span>.</span>
		</div>
	</transition>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/reactions-viewer.details.vue'),
	props: {
		reaction: {
			type: String,
			required: true,
		},
		users: {
			type: Array,
			required: true,
		},
		source: {
			required: true,
		}
	},
	data() {
		return {
			show: false
		};
	},
	mounted() {
		this.show = true;

		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();

			const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
			const y = rect.top + window.pageYOffset + this.source.offsetHeight;
			popover.style.left = (x - 28) + 'px';
			popover.style.top = (y + 16) + 'px';
		});
	}
	methods: {
		close() {
			this.show = false;
			setTimeout(this.destroyDom, 300);
		}
	}
})
</script>

<style lang="stylus" scoped>
.buebdbiu
	$bgcolor = var(--popupBg)
	z-index 10000
	display block
	position absolute
	min-width max-content
	max-width 240px
	font-size 0.8em
	padding 5px 8px
	background $bgcolor
	text-align center
	color var(--text)
	border-radius 4px
	box-shadow 0 var(--lineWidth) 4px rgba(#000, 0.25)

	&:before
		content ""
		pointer-events none
		display block
		position absolute
		top -28px
		left 12px
		border-top solid 14px transparent
		border-right solid 14px transparent
		border-bottom solid 14px rgba(#000, 0.1)
		border-left solid 14px transparent

	&:after
		content ""
		pointer-events none
		display block
		position absolute
		top -27px
		left 12px
		border-top solid 14px transparent
		border-right solid 14px transparent
		border-bottom solid 14px $bgcolor
		border-left solid 14px transparent
</style>
