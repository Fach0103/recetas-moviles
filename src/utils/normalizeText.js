/**
 * Normaliza texto para comparar sin distinguir mayúsculas ni tildes.
 * "Arepa" === "arepa" === "ARÉPA" === "arepa " después de normalizar.
 */
function normalizeText(text = '') {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos/diacríticos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

module.exports = normalizeText;
