// Espera N milisegundos (para respetar rate limit de Scryfall: máx 10 req/s)
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
