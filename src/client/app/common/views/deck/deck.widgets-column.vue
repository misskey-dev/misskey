<template>
<x-column :menu="menu" :naked="true" :narrow="true" :name="name" :column="column" :is-stacked="isStacked" class="wtdtxvecapixsepjtcupubtsmometobz">
	<template #header><fa icon="calculator"/>{{ name }}</template>

	<div class="gqpwvtwtprsbmnssnbicggtwqhmylhnq">
		<template v-if="edit">
			<header>
				<select v-model="widgetAdderSelected" @change="addWidget">
					<option value="profile">{{ $t('@.widgets.profile') }}</option>
					<option value="analog-clock">{{ $t('@.widgets.analog-clock') }}</option>
					<option value="calendar">{{ $t('@.widgets.calendar') }}</option>
					<option value="timemachine">{{ $t('@.widgets.timemachine') }}</option>
					<option value="activity">{{ $t('@.widgets.activity') }}</option>
					<option value="rss">{{ $t('@.widgets.rss') }}</option>
					<option value="trends">{{ $t('@.widgets.trends') }}</option>
					<option value="photo-stream">{{ $t('@.widgets.photo-stream') }}</option>
					<option value="slideshow">{{ $t('@.widgets.slideshow') }}</option>
					<option value="version">{{ $t('@.widgets.version') }}</option>
					<option value="broadcast">{{ $t('@.widgets.broadcast') }}</option>
					<option value="notifications">{{ $t('@.widgets.notifications') }}</option>
					<option value="users">{{ $t('@.widgets.users') }}</option>
					<option value="polls">{{ $t('@.widgets.polls') }}</option>
					<option value="post-form">{{ $t('@.widgets.post-form') }}</option>
					<option value="messaging">{{ $t('@.messaging') }}</option>
					<option value="memo">{{ $t('@.widgets.memo') }}</option>
					<option value="hashtags">{{ $t('@.widgets.hashtags') }}</option>
					<option value="posts-monitor">{{ $t('@.widgets.posts-monitor') }}</option>
					<option value="server">{{ $t('@.widgets.server') }}</option>
					<option value="queue">{{ $t('@.widgets.queue') }}</option>
					<option value="nav">{{ $t('@.widgets.nav') }}</option>
					<option value="tips">{{ $t('@.widgets.tips') }}</option>
				</select>
			</header>
			<x-draggable
				:list="column.widgets"
				animation="150"
				@sort="onWidgetSort"
			>
				<div v-for="widget in column.widgets" class="customize-container" :key="widget.id" @contextmenu.stop.prevent="widgetFunc(widget.id)">
					<button class="remove" @click="removeWidget(widget)"><fa icon="times"/></button>
					<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" platform="deck" :column="column"/>
				</div>
			</x-draggable>
		</template>
		<template v-else>
			<component class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" platform="deck" :column="column"/>
		</template>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import XColumn from './deck.column.vue';
import * as XDraggable from 'vuedraggable';
import { v4 as uuid } from 'uuid';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XColumn,
		XDraggable
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			edit: false,
			menu: null,
			widgetAdderSelected: null
		}
	},

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;
			return this.$t('@deck.widgets');
		}
	},

	created() {
		this.menu = [{
			icon: 'cog',
			text: this.$t('edit'),
			action: () => {
				this.edit = !this.edit;
			}
		}];
	},

	methods: {
		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveWidgets();
		},

		addWidget() {
			this.$store.commit('addDeckWidget', {
				id: this.column.id,
				widget: {
					name: this.widgetAdderSelected,
					id: uuid(),
					data: {}
				}
			});

			this.widgetAdderSelected = null;
		},

		removeWidget(widget) {
			this.$store.commit('removeDeckWidget', {
				id: this.column.id,
				widget
			});
		},

		saveWidgets() {
			this.$store.commit('updateDeckColumn', this.column);
		}
	}
});
</script>

<style lang="stylus" scoped>
.wtdtxvecapixsepjtcupubtsmometobz
	.gqpwvtwtprsbmnssnbicggtwqhmylhnq
		> header
			padding 16px

			> *
				width 100%
				padding 4px

		.widget, .customize-container
			margin 8px

			&:first-of-type
				margin-top 0

		.customize-container
			cursor move

			> *:not(.remove)
				pointer-events none

			> .remove
				position absolute
				z-index 1
				top 8px
				right 8px
				width 32px
				height 32px
				color #fff
				background rgba(#000, 0.7)
				border-radius 4px

</style>

