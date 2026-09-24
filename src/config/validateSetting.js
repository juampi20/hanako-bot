'use strict';

const botConfig = require('./bot');

function validateSetting(key, raw) {
	const def = botConfig.SETTINGS_REGISTRY[key];
	if (!def) throw new Error(`Clave '${key}' no existe.`);

	switch (def.type) {
	case 'string': {
		const s = String(raw).trim();
		if (!s) throw new Error('El valor no puede estar vacío.');
		return s;
	}
	case 'number': {
		const n = Number(raw);
		if (!Number.isInteger(n)) throw new Error('Debe ser un número entero.');
		if (n < 1) throw new Error('Debe ser mayor o igual a 1.');
		return n;
	}
	case 'boolean': {
		if (raw === 'true' || raw === true) return true;
		if (raw === 'false' || raw === false) return false;
		throw new Error('Debe ser \'true\' o \'false\'.');
	}
	case 'snowflake': {
		const s = String(raw).trim();
		if (!/^\d{17,20}$/.test(s)) throw new Error('Debe ser un ID de Discord de 17-20 dígitos.');
		return s;
	}
	default:
		throw new Error(`Tipo desconocido: ${def.type}`);
	}
}

module.exports = { validateSetting };
