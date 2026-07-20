/**
 * Progress bar generator — ascii-progress style.
 *
 *   [▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇] 100%
 *   [▇▇▇▇▇▇▇▇▇▇▇▇▇====]  89%
 *   [▇▇▇▇▇▇▇▇▇▇▇======]  73%
 *   [▇▇▇▇▇▇▇===========]  50%
 *   [▇▇▇===============]  20%
 *   [===================]   0%
 */

const FILLED = '▇';
const EMPTY = '=';
const OPEN = '[';
const CLOSE = ']';

/**
 * Build a progress bar string in ascii-progress style.
 *
 * @param {number} value  Current value (0 or greater).
 * @param {number} max    Maximum / total value.
 * @param {number} width  Number of tile cells inside the brackets (default 15).
 * @returns {string} Progress bar e.g. "[▇▇▇▇▇=========] 50%"
 */
function progressBar(value, max, width = 15) {
	const ratio = Math.max(0, Math.min(1, value / max));
	const filled = Math.round(ratio * width);
	const empty = width - filled;

	return (
		OPEN +
        FILLED.repeat(filled) +
        EMPTY.repeat(empty) +
        CLOSE
	);
}

module.exports = { progressBar };
