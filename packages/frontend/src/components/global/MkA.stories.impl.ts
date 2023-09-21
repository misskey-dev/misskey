/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import MkA from './MkA.vue';
import { tick } from '@/scripts/test-utils';
export const Default = {
	render(args) {
		return {
			components: {
				MkA,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkA v-bind="props">Misskey</MkA>',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const a = canvas.getByRole<HTMLAnchorElement>('link');
		await expect(a.href).toMatch(/^https?:\/\/.*#test$/);
		await userEvent.click(a, { button: 2 });
		await tick();
		const menu = canvas.getByRole('menu');
		await expect(menu).toBeInTheDocument();
		await userEvent.click(a, { button: 0 });
		a.blur();
		await tick();
		await expect(menu).not.toBeInTheDocument();
	},
	args: {
		to: '#test',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkA>;
