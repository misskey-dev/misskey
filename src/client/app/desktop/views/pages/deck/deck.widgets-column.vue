<template>
<div class="wtdtxvecapixsepjtcupubtsmometobz">
	<x-column :id="column.id" :menu="menu" :naked="true" :narrow="true">
		<span slot="header">%fa:calculator%%i18n:common.deck.widgets%</span>

		<div class="gqpwvtwtprsbmnssnbicggtwqhmylhnq">
			<template v-if="edit">
				<header>
					<select v-model="widgetAdderSelected">
						<option value="profile">%i18n:common.widgets.profile%</option>
						<option value="analog-clock">%i18n:common.widgets.analog-clock%</option>
						<option value="calendar">%i18n:common.widgets.calendar%</option>
						<option value="timemachine">%i18n:common.widgets.timemachine%</option>
						<option value="activity">%i18n:common.widgets.activity%</option>
						<option value="rss">%i18n:common.widgets.rss%</option>
						<option value="trends">%i18n:common.widgets.trends%</option>
						<option value="photo-stream">%i18n:common.widgets.photo-stream%</option>
						<option value="slideshow">%i18n:common.widgets.slideshow%</option>
						<option value="version">%i18n:common.widgets.version%</option>
						<option value="broadcast">%i18n:common.widgets.broadcast%</option>
						<option value="notifications">%i18n:common.widgets.notifications%</option>
						<option value="users">%i18n:common.widgets.users%</option>
						<option value="polls">%i18n:common.widgets.polls%</option>
						<option value="post-form">%i18n:common.widgets.post-form%</option>
						<option value="messaging">%i18n:common.widgets.messaging%</option>
						<option value="memo">%i18n:common.widgets.memo%</option>
						<option value="server">%i18n:common.widgets.server%</option>
						<option value="donation">%i18n:common.widgets.donation%</option>
						<option value="nav">%i18n:common.widgets.nav%</option>
						<option value="tips">%i18n:common.widgets.tips%</option>
					</select>
					<button @click="addWidget">%i18n:@add%</button>
				</header>
				<x-draggable
					:list="column.widgets"
					:options="{ handle: '.handle', animation: 150 }"
					@sort="onWidgetSort"
				>
					<div v-for="widget in column.widgets" class="customize-container" :key="widget.id">
						<header>
							<span class="handle">%fa:bars%</span>{{ widget.name }}<button class="remove" @click="removeWidget(widget)">%fa:times%</button>
						</header>
						<div @click="widgetFunc(widget.id)">
							<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" platform="deck"/>
						</div>
					</div>
				</x-draggable>
			</template>
			<template v-else>
				<component class="widget" v-for="widget in column.widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" platform="deck"/>
			</template>
		</div>
	</x-column>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import * as XDraggable from 'vuedraggable';
import * as uuid from 'uuid';

export default Vue.extend({
	components: {
		XColumn,
		XDraggable
	},

	props: {
		column: {
			type: Object,
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

	created() {
		this.menu = [{
			content: '%fa:cog% %i18n:@edit%',
			onClick: () => {
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
			this.$store.dispatch('settings/addDeckWidget', {
				id: this.column.id,
				widget: {
					name: this.widgetAdderSelected,
					id: uuid(),
					data: {}
				}
			});
		},

		removeWidget(widget) {
			this.$store.dispatch('settings/removeDeckWidget', {
				id: this.column.id,
				widget
			});
		},

		saveWidgets() {
			this.$store.dispatch('settings/saveDeck');
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	.gqpwvtwtprsbmnssnbicggtwqhmylhnq
		.widget, .customize-container
			margin 8px

			&:first-of-type
				margin-top 0

		.customize-container
			background #fff

		> header
			color isDark ? #fff : #000

.wtdtxvecapixsepjtcupubtsmometobz[data-darkmode]
	root(true)

.wtdtxvecapixsepjtcupubtsmometobz:not([data-darkmode])
	root(false)

</style>

