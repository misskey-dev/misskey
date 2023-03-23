/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import classic_sidebar from './classic.sidebar.vue';
const meta = {
	title: 'ui/classic.sidebar',
	component: classic_sidebar,
} satisfies Meta<typeof classic_sidebar>;
export const Default = {
	render(args) {
		return {
			components: {
				classic_sidebar,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<classic_sidebar v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof classic_sidebar>;
export default meta;
