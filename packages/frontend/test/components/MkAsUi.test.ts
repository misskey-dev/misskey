import MkAsUi from '@/components/MkAsUi.vue';
import { fireEvent, render } from '@testing-library/vue';
import { components as globalComponents } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import { assert, describe, expect, test, vi } from 'vitest';
import { ComponentProps } from 'vue-component-type-helpers';
import { AsUiComponent } from '@/scripts/aiscript/ui.js';
import { ref } from 'vue';

describe('MkAsUi', () => {
	function renderComponent<C extends AsUiComponent>(
		component: C,
		opts?: Omit<ComponentProps<typeof MkAsUi>, 'component' | 'components'>
	) {
		const componentRef = ref(component);
		const componentsRef = ref([componentRef]);
		const mkAsUi = render(MkAsUi, {
			props: {
				component: componentRef.value,
				components: componentsRef.value,
				...opts,
			},
			global: { directives, components: globalComponents },
		});
		return { mkAsUi, component };
	}

	test('root', async () => {
		const { mkAsUi } = renderComponent({
			type: 'root',
			id: 'id',
			children: [],
		});
		const element = mkAsUi.baseElement;
		assert(element instanceof HTMLElement);
		expect(element.innerText).toBe('');
	});

	test('text', async () => {
		const { mkAsUi } = renderComponent({
			type: 'text',
			id: 'id',
			text: 'Hello, world!',
		});
		expect(mkAsUi.queryByText('Hello, world!')).toBeTruthy();
	});

	test('mfm', async () => {
		const { component, mkAsUi } = renderComponent({
			type: 'mfm',
			id: 'id',
			text: '$[clickable.ev=evId Click me!]',
			onClickEv: vi.fn((evId) => {
				expect(evId).toBe('evId');
			}),
		});
		await fireEvent.click(mkAsUi.getByText('Click me!'));
		expect(component.onClickEv).toHaveBeenCalledOnce();
	});

	test('button', async () => {
		const { component, mkAsUi } = renderComponent({
			type: 'button',
			id: 'id',
			text: 'Click me!',
			onClick: vi.fn(),
		});
		await fireEvent.click(mkAsUi.getByText('Click me!'));
		expect(component.onClick).toHaveBeenCalledOnce();
	});

	test('buttons', async () => {
		const { component, mkAsUi } = renderComponent({
			type: 'buttons',
			id: 'id',
			buttons: [
				{
					text: 'left',
					id: 'test',
					onClick: vi.fn(),
				},
				{
					text: 'right',
					id: 'test',
					onClick: vi.fn(),
				},
			],
		});
		await fireEvent.click(mkAsUi.getByText('left'));
		expect(component.buttons[0].onClick).toHaveBeenCalledOnce();
		await fireEvent.click(mkAsUi.getByText('right'));
		expect(component.buttons[0].onClick).toHaveBeenCalledOnce();
	});
});
