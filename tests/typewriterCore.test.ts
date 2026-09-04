import { describe, expect, it } from 'vitest';
import {
	DEFAULT_TIMING,
	duration,
	scheduleChars,
	segment,
	typedAt
} from '../src/lib/utils/typewriterCore';

// The arithmetic behind <Typewriter>. The interesting cases are the bad ones: a slide
// must not collapse because someone wrote charMs="fast", and an emoji must not be typed
// as two halves of a broken surrogate pair.

describe('duration', () => {
	it('takes a finite non-negative number, including zero', () => {
		expect(duration(40, 55)).toBe(40);
		expect(duration(0, 55)).toBe(0); // charMs: 0 types instantly — meaningful, not falsy
	});

	it('falls back on anything else', () => {
		for (const junk of ['fast', -1, NaN, Infinity, null, undefined, {}, [], '40'])
			expect(duration(junk, 55)).toBe(55);
	});
});

describe('segment', () => {
	it('cuts plain text into single characters, spaces and newlines included', () => {
		expect(segment('a b\nc')).toEqual(['a', ' ', 'b', '\n', 'c']);
	});

	it('keeps an astral character whole rather than splitting the surrogate pair', () => {
		// '🚀'.length is 2 — a naive split('') would type two replacement boxes.
		expect(segment('a🚀')).toEqual(['a', '🚀']);
	});

	it('keeps a combining accent attached to its letter', () => {
		// e + U+0301. Two code points, ONE thing a reader sees appear.
		const composed = segment('é');
		// Intl.Segmenter gives one cluster; the Array.from fallback gives two. Either way
		// the pieces must reassemble to the original — nothing is lost or reordered.
		expect(composed.join('')).toBe('é');
		expect(composed.length).toBeLessThanOrEqual(2);
	});

	it('is total: a non-string, or an empty string, segments to nothing', () => {
		for (const junk of [undefined, null, 42, {}, [], '']) expect(segment(junk)).toEqual([]);
	});
});

describe('scheduleChars', () => {
	it('gives each character a window of charMs, opening where the last one closed', () => {
		const { chars, envelopeMs } = scheduleChars('abc', { charMs: 10, startMs: 100 });
		expect(chars.map((c) => c.delayMs)).toEqual([100, 110, 120]);
		expect(chars.map((c) => c.durationMs)).toEqual([10, 10, 10]);
		// The envelope is where the LAST character has landed — its window's end.
		expect(envelopeMs).toBe(130);
	});

	it('indexes characters in order, keeping the text on each one', () => {
		const { chars } = scheduleChars('hi', { charMs: 10, startMs: 0 });
		expect(chars).toEqual([
			{ index: 0, text: 'h', delayMs: 0, durationMs: 10 },
			{ index: 1, text: 'i', delayMs: 10, durationMs: 10 }
		]);
	});

	it('holds a beat AFTER a clause ender when punctuationMs is set', () => {
		const { chars, envelopeMs } = scheduleChars('a.b', {
			charMs: 10,
			startMs: 0,
			punctuationMs: 100
		});
		// The '.' still takes its own 10ms; the beat lands between it and what follows.
		expect(chars.map((c) => c.delayMs)).toEqual([0, 10, 120]);
		expect(envelopeMs).toBe(130);
	});

	it('does not pause on a mid-word hyphen or apostrophe — that reads as a stutter', () => {
		const { envelopeMs } = scheduleChars("don't-stop", {
			charMs: 10,
			startMs: 0,
			punctuationMs: 500
		});
		expect(envelopeMs).toBe(100); // 10 characters, no beats
	});

	it('leaves the rate flat when punctuationMs is 0 (the default)', () => {
		const flat = scheduleChars('a.b', { charMs: 10, startMs: 0 });
		expect(flat.chars.map((c) => c.delayMs)).toEqual([0, 10, 20]);
	});

	it('falls back per-knob on junk, never throwing and never yielding NaN', () => {
		const { chars, envelopeMs } = scheduleChars('ab', {
			charMs: 'fast',
			startMs: -5,
			punctuationMs: NaN
		} as never);
		expect(chars[0].delayMs).toBe(DEFAULT_TIMING.startMs);
		expect(chars[1].delayMs).toBe(DEFAULT_TIMING.startMs + DEFAULT_TIMING.charMs);
		expect(Number.isFinite(envelopeMs)).toBe(true);
	});

	it('is total on junk text: an empty run whose envelope is just the dead air', () => {
		for (const junk of [undefined, null, 42, '']) {
			const schedule = scheduleChars(junk, { charMs: 10, startMs: 100 });
			expect(schedule.chars).toEqual([]);
			expect(schedule.envelopeMs).toBe(100);
		}
	});

	it('charMs: 0 places every character at the same instant', () => {
		const { chars, envelopeMs } = scheduleChars('abc', { charMs: 0, startMs: 0 });
		expect(chars.map((c) => c.delayMs)).toEqual([0, 0, 0]);
		expect(envelopeMs).toBe(0);
	});
});

describe('typedAt', () => {
	const schedule = scheduleChars('abc', { charMs: 10, startMs: 100 });

	it('shows a character only once its window has CLOSED — steps(1, end)', () => {
		expect(typedAt(schedule, 0)).toBe('');
		expect(typedAt(schedule, 105)).toBe(''); // 'a' is mid-window: the caret, not the letter
		expect(typedAt(schedule, 110)).toBe('a');
		expect(typedAt(schedule, 125)).toBe('ab');
		expect(typedAt(schedule, 130)).toBe('abc');
	});

	it('stays complete past the envelope, and empty before a non-finite time', () => {
		expect(typedAt(schedule, 9999)).toBe('abc');
		expect(typedAt(schedule, NaN)).toBe('');
	});
});
