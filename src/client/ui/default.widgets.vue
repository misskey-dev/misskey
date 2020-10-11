<template>
<div class="efzpzdvf">
	<template v-if="editMode">
		<MkButton primary @click="addWidget" class="add"><Fa :icon="faPlus"/></MkButton>
		<XDraggable
			:list="widgets"
			handle=".handle"
			animation="150"
			class="sortable"
			@sort="onWidgetSort"
		>
			<div v-for="widget in widgets" class="customize-container _panel" :key="widget.id">
				<header>
					<span class="handle"><Fa :icon="faBars"/></span>{{ $t('_widgets.' + widget.name) }}<button class="remove _button" @click="removeWidget(widget)"><Fa :icon="faTimes"/></button>
				</header>
				<div @click="widgetFunc(widget.id)">
					<component class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id"/>
				</div>
			</div>
		</XDraggable>
		<button @click="editMode = false" class="_textButton" style="font-size: 0.9em;"><Fa :icon="faCheck"/> {{ $t('editWidgetsExit') }}</button>
	</template>
	<template v-else>
		<component v-for="widget in widgets" class="_close_ _forceContainerFull_" :is="`mkw-${widget.name}`" :key="widget.id" :widget="widget"/>
		<button @click="editMode = true" class="_textButton" style="font-size: 0.9em;"><Fa :icon="faPencilAlt"/> {{ $t('editWidgets') }}</button>
	</template>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { faPencilAlt, faPlus, faBars, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { widgets } from '@/widgets';
import * as os from '@/os';
import MkButton from '@/components/ui/button.vue';

export default defineComponent({
	components: {
		MkButton,
		XDraggable: defineAsyncComponent(() => import('vue-draggable-next').then(x => x.VueDraggableNext)),
	},

	emits: ['mounted'],

	data() {
		return {
			editMode: false,
			faPencilAlt, faPlus, faBars, faTimes, faCheck,
		};
	},

	computed: {
		widgets(): any {
			return this.$store.state.deviceUser.widgets;
		},
	},

	mounted() {
		this.$emit('mounted', this.$el);
	},

	methods: {
		widgetFunc(id) {
			this.$refs[id][0].setting();
		},

		onWidgetSort() {
			this.saveHome();
		},

		async addWidget() {
			const { canceled, result: widget } = await os.dialog({
				type: null,
				title: this.$t('chooseWidget'),
				select: {
					items: widgets.map(widget => ({
						value: widget,
						text: this.$t('_widgets.' + widget),
					}))
				},
				showCancelButton: true
			});
			if (canceled) return;

			this.$store.commit('deviceUser/addWidget', {
				name: widget,
				id: uuid(),
				place: null,
				data: {}
			});
		},

		removeWidget(widget) {
			this.$store.commit('deviceUser/removeWidget', widget);
		},

		saveHome() {
			this.$store.commit('deviceUser/setWidgets', this.widgets);
		}
	}
});
</script>

<style lang="scss" scoped>
.efzpzdvf {
	position: sticky;
	height: min-content;
	min-height: 100vh;
	padding: var(--margin) 0;
	box-sizing: border-box;

	> * {
		margin: var(--margin) 0;
		width: 300px;

		&:first-child {
			margin-top: 0;
		}
	}

	> .add {
		margin: 0 auto;
	}

	.customize-container {
		margin: 8px 0;

		> header {
			position: relative;
			line-height: 32px;

			> .handle {
				padding: 0 8px;
				cursor: move;
			}

			> .remove {
				position: absolute;
				top: 0;
				right: 0;
				padding: 0 8px;
				line-height: 32px;
			}
		}

		> div {
			padding: 8px;

			> * {
				pointer-events: none;
			}
		}
	}
}
</style>
