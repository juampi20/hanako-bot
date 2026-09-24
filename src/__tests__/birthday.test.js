'use strict';

const { validateDayMonth, MONTHS } = require('../commands/birthday/birthday');
const { TIMEZONES, isValidTimezone } = require('../utils/timezones');

describe('validateDayMonth', () => {
	test('12 de junio (12, 6) es válido', () => {
		expect(validateDayMonth(12, 6)).toEqual({ ok: true });
	});

	test('31 de febrero (31, 2) es inválido', () => {
		expect(validateDayMonth(31, 2).ok).toBe(false);
	});

	test('31 de abril (31, 4) es inválido', () => {
		expect(validateDayMonth(31, 4).ok).toBe(false);
	});

	test('29 de febrero (29, 2) es válido (año bisiesto 2000)', () => {
		expect(validateDayMonth(29, 2)).toEqual({ ok: true });
	});

	test('30 de febrero (30, 2) es inválido', () => {
		expect(validateDayMonth(30, 2).ok).toBe(false);
	});

	test('mes 13 es inválido', () => {
		expect(validateDayMonth(12, 13).ok).toBe(false);
	});

	test('día 0 es inválido', () => {
		expect(validateDayMonth(0, 6).ok).toBe(false);
	});
});

describe('MONTHS', () => {
	test('tiene exactamente 12 meses en español', () => {
		expect(MONTHS).toHaveLength(12);
		expect(MONTHS[5]).toBe('junio');
		expect(MONTHS[11]).toBe('diciembre');
	});
});

describe('isValidTimezone', () => {
	test('acepta zonas IANA de Argentina (faltantes en supportedValuesOf)', () => {
		expect(isValidTimezone('America/Argentina/Buenos_Aires')).toBe(true);
		expect(isValidTimezone('America/Argentina/Mendoza')).toBe(true);
		expect(isValidTimezone('America/Argentina/Cordoba')).toBe(true);
	});

	test('acepta UTC y zonas de México/Chile/España', () => {
		expect(isValidTimezone('UTC')).toBe(true);
		expect(isValidTimezone('America/Mexico_City')).toBe(true);
		expect(isValidTimezone('America/Santiago')).toBe(true);
		expect(isValidTimezone('Europe/Madrid')).toBe(true);
	});

	test('rechaza zonas inexistentes', () => {
		expect(isValidTimezone('Mars/Olympus')).toBe(false);
		expect(isValidTimezone('America/Argentina/Nowhere')).toBe(false);
		expect(isValidTimezone('')).toBe(false);
	});

	test('no depende de Intl.supportedValuesOf (lista recortada en Node 22)', () => {
		const supported = Intl.supportedValuesOf('timeZone');
		expect(supported.includes('America/Argentina/Buenos_Aires')).toBe(false);
		expect(isValidTimezone('America/Argentina/Buenos_Aires')).toBe(true);
	});
});

describe('TIMEZONES', () => {
	test('incluye todas las zonas de Argentina principales', () => {
		expect(TIMEZONES).toContain('America/Argentina/Buenos_Aires');
		expect(TIMEZONES).toContain('America/Argentina/Mendoza');
	});

	test('cada zona es válida según DateTimeFormat', () => {
		for (const zone of TIMEZONES) {
			expect(isValidTimezone(zone)).toBe(true);
		}
	});
});
