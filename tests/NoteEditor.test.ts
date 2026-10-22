// NoteEditor's DOM contract: it loads the note into a textarea, SAVE posts the
// edit with the load's fingerprint, a refusal stays open and shows why, and the
// console's shortcuts never see a key typed inside it. fetch is mocked; `events`
// is Svelte 5's way to listen to a legacy component's dispatched events.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import NoteEditor from '../src/lib/components/NoteEditor.svelte';

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function mockFetch(saveResponse: { status: number; body: object }) {
	const calls: Array<{ url: string; init?: RequestInit }> = [];
	globalThis.fetch = vi.fn(async (url: string, init?: RequestInit) => {
		calls.push({ url, init });
		const r = url.includes('note-load')
			? { status: 200, body: { text: '<p>Hello.</p>', fingerprint: 'abc12345', file: 'src/routes/d/s.html/+page.svelte' } }
			: saveResponse;
		return new Response(JSON.stringify(r.body), { status: r.status });
	}) as unknown as typeof fetch;
	return calls;
}

describe('NoteEditor', () => {
	it('loads the note and saves the edit with its fingerprint, then closes', async () => {
		const calls = mockFetch({ status: 200, body: { file: 'x' } });
		const closed = vi.fn();
		const { container, findByLabelText } = render(NoteEditor, {
			props: { route: '/d/s.html' },
			events: { close: closed }
		});

		const area = (await findByLabelText('Note source')) as HTMLTextAreaElement;
		expect(area.value).toBe('<p>Hello.</p>');
		expect(calls[0].url).toContain('route=%2Fd%2Fs.html');

		await fireEvent.input(area, { target: { value: '<p>Hi.</p>' } });
		await fireEvent.keyDown(area, { key: 's', ctrlKey: true });

		await waitFor(() => expect(closed).toHaveBeenCalled());
		const sent = JSON.parse(String(calls[1].init?.body));
		expect(sent).toEqual({ route: '/d/s.html', text: '<p>Hi.</p>', fingerprint: 'abc12345' });
	});

	it('stays open and shows the reason when the server refuses', async () => {
		mockFetch({ status: 409, body: { error: 'That edit would break the slide.' } });
		const closed = vi.fn();
		const { container, findByRole, findByLabelText } = render(NoteEditor, {
			props: { route: '/d/s.html' },
			events: { close: closed }
		});

		const area = (await findByLabelText('Note source')) as HTMLTextAreaElement;
		await fireEvent.input(area, { target: { value: '<p>broken' } });
		await fireEvent.click(container.querySelector('button.save')!);

		expect((await findByRole('alert')).textContent).toMatch(/break the slide/);
		expect(closed).not.toHaveBeenCalled();
		expect(area.value).toBe('<p>broken');
	});

	it('keeps keys from reaching the console, and Esc closes an unchanged note', async () => {
		mockFetch({ status: 200, body: {} });
		const closed = vi.fn();
		const { container, findByLabelText } = render(NoteEditor, {
			props: { route: '/d/s.html' },
			events: { close: closed }
		});
		const onWindow = vi.fn();
		window.addEventListener('keydown', onWindow);

		const area = (await findByLabelText('Note source')) as HTMLTextAreaElement;
		await fireEvent.keyDown(area, { key: 'ArrowRight' });
		await fireEvent.keyDown(area, { key: 'Escape' });

		window.removeEventListener('keydown', onWindow);
		expect(onWindow).not.toHaveBeenCalled();
		expect(closed).toHaveBeenCalled();
	});
});
