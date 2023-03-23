/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import navbar_ from './navbar.vue';
const meta = {
	title: 'pages/settings/navbar',
	component: navbar_,
} satisfies Meta<typeof navbar_>;
export const Default = {
	render(args) {
		return {
			components: {
				navbar_,
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
			template: '<navbar_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof navbar_>;
export default meta;
