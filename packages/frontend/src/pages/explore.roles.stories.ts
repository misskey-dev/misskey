/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import explore_roles from './explore.roles.vue';
const meta = {
	title: 'pages/explore.roles',
	component: explore_roles,
} satisfies Meta<typeof explore_roles>;
export const Default = {
	render(args) {
		return {
			components: {
				explore_roles,
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
			template: '<explore_roles v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_roles>;
export default meta;
