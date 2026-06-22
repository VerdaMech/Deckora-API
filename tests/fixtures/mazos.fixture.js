// ─── Helpers ────────────────────────────────────────────────────────────────

function carta(nombre, tipo, cantidad, esTierraBasica = false, esComandante = false) {
  return { nombre, tipo, cantidad, es_tierra_basica: esTierraBasica, es_comandante: esComandante };
}

function spells(cantidad, desde = 1) {
  return Array.from({ length: cantidad }, (_, i) => carta(`Spell ${desde + i}`, 'Sorcery', 1));
}

// ─── Commander ──────────────────────────────────────────────────────────────

export const COMMANDER_VALIDO = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(69),
  ],
};

export const COMMANDER_99_CARTAS = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(68),
  ],
};

export const COMMANDER_101_CARTAS = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(70),
  ],
};

export const COMMANDER_SIN_COMANDANTE = {
  cartas: [
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(70),
  ],
};

export const COMMANDER_DOS_COMANDANTES = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Korvold, Fae-Cursed King', 'Legendary Creature — Dragon Noble', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(68),
  ],
};

export const COMMANDER_NO_LEGENDARY_CREATURE = {
  cartas: [
    carta('Dark Ritual', 'Sorcery', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(69),
  ],
};

export const COMMANDER_CON_DUPLICADO = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Sol Ring', 'Artifact', 2),
    carta('Forest', 'Basic Land — Forest', 30, true),
    ...spells(67),
  ],
};

export const COMMANDER_TIERRAS_BASICAS_DUPLICADAS = {
  cartas: [
    carta('Atraxa, Praetors Voice', 'Legendary Creature — Phyrexian Praetor', 1, false, true),
    carta('Forest', 'Basic Land — Forest', 30, true),
    carta('Island', 'Basic Land — Island', 5, true),
    ...spells(64),
  ],
};

export const COMMANDER_VACIO = { cartas: [] };

export const COMMANDER_MULTIPLES_ERRORES = {
  cartas: [
    carta('Forest', 'Basic Land — Forest', 30, true),
    carta('Sol Ring', 'Artifact', 2),
    ...spells(18),
  ],
};

// ─── Standard ───────────────────────────────────────────────────────────────

export const STANDARD_60_VALIDO = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 4),
    carta('Counterspell', 'Instant', 4),
    carta('Dark Ritual', 'Sorcery', 4),
    carta('Birds of Paradise', 'Creature', 4),
    carta('Llanowar Elves', 'Creature', 4),
    carta('Swords to Plowshares', 'Instant', 4),
    carta('Giant Growth', 'Instant', 4),
    carta('Ancestral Recall', 'Instant', 4),
    carta('Black Lotus', 'Artifact', 4),
    carta('Mox Sapphire', 'Artifact', 4),
    carta('Plains', 'Basic Land — Plains', 4, true),
    carta('Island', 'Basic Land — Island', 4, true),
    carta('Swamp', 'Basic Land — Swamp', 4, true),
    carta('Mountain', 'Basic Land — Mountain', 4, true),
    carta('Forest', 'Basic Land — Forest', 4, true),
  ],
};

export const STANDARD_59_CARTAS = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 4),
    ...Array.from({ length: 13 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 4)),
    carta('Forest', 'Basic Land — Forest', 3, true),
  ],
};

export const STANDARD_250_VALIDO = {
  cartas: Array.from({ length: 62 }, (_, i) =>
    carta(`Spell ${i + 1}`, 'Sorcery', 4)
  ).concat([carta('Forest', 'Basic Land — Forest', 2, true)]),
};

export const STANDARD_251_CARTAS = {
  cartas: Array.from({ length: 62 }, (_, i) =>
    carta(`Spell ${i + 1}`, 'Sorcery', 4)
  ).concat([carta('Forest', 'Basic Land — Forest', 3, true)]),
};

export const STANDARD_CARTA_5_COPIAS = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 5),
    ...Array.from({ length: 55 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

export const STANDARD_TIERRA_BASICA_MUCHAS = {
  cartas: [
    carta('Plains', 'Basic Land — Plains', 20, true),
    ...Array.from({ length: 40 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

export const STANDARD_EXACTAMENTE_4_COPIAS = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 4),
    ...Array.from({ length: 56 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

// ─── Modern / Pioneer / Legacy (mínimo 60, sin máximo) ─────────────────────

export const FORMATO_60_VALIDO = {
  cartas: Array.from({ length: 15 }, (_, i) =>
    carta(`Spell ${i + 1}`, 'Sorcery', 4)
  ),
};

export const FORMATO_59_INVALIDO = {
  cartas: [
    ...Array.from({ length: 14 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 4)),
    carta('Extra Spell', 'Sorcery', 3),
  ],
};

export const FORMATO_CARTA_5_COPIAS = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 5),
    ...Array.from({ length: 55 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

export const FORMATO_TIERRA_BASICA_MUCHAS = {
  cartas: [
    carta('Plains', 'Basic Land — Plains', 20, true),
    ...Array.from({ length: 40 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

export const FORMATO_EXACTAMENTE_4_COPIAS = {
  cartas: [
    carta('Lightning Bolt', 'Instant', 4),
    ...Array.from({ length: 56 }, (_, i) => carta(`Spell ${i + 1}`, 'Sorcery', 1)),
  ],
};

export const FORMATO_SIN_LIMITE_SUPERIOR = {
  cartas: Array.from({ length: 125 }, (_, i) =>
    carta(`Spell ${i + 1}`, 'Sorcery', 4)
  ),
};

export const FORMATO_VACIO = { cartas: [] };
