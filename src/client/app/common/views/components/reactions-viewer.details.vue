<template>
<transition name="zoom-in-top">
	<div class="buebdbiu" ref="popover" v-if="show">
		<i18n path="few-users" v-if="users.length <= 10">
			<span slot="users">
				<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
					<mk-avatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
					<mk-user-name :user="u" :nowrap="false" style="line-height: 24px;"/>
				</b>
			</span>
			<mk-reaction-icon slot="reaction" :reaction="reaction" ref="icon" />
		</i18n>
		<i18n path="many-users" v-if="10 < users.length">
			<span slot="users">
				<b v-for="u in users" :key="u.id" style="margin-right: 12px;">
					<mk-avatar :user="u" style="width: 24px; height: 24px; margin-right: 2px;"/>
					<mk-user-name :user="u" :nowrap="false" style="line-height: 24px;"/>
				</b>
			</span>
			<span slot="ommited">{{ count - 10 }}</span>
			<mk-reaction-icon slot="reaction" :reaction="reaction" ref="icon" />
		</i18n>
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
		count: {
			type: Number,
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

			if (this.source == null) {
				this.destroyDom();
				return;
			}
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
	max-width 240px
	font-size 0.8em
	padding 6px 8px
	background $bgcolor
	text-align center
	color var(--text)
	border-radius 4px
	box-shadow 0 var(--lineWidth) 4px rgba(#000, 0.25)
	pointer-events none
	transform-origin center -16px

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
