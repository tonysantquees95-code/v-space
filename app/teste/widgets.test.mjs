import test from "node:test";
import assert from "node:assert/strict";
import { angulosDoRelogio, descreverTempo, horaDoEvento, lerClima, lerLugares } from "../src/widgets.ts";

test("descreverTempo: códigos principais", () => {
  assert.equal(descreverTempo(0, true).texto, "Céu limpo");
  assert.equal(descreverTempo(0, false).texto, "Noite limpa");
  assert.equal(descreverTempo(61).texto, "Chuva");
  assert.equal(descreverTempo(95).texto, "Tempestade");
  assert.equal(descreverTempo(3).texto, "Nublado");
});
test("lerClima: valida a resposta da rede", () => {
  const ok = { current: { temperature_2m: 21.6, weather_code: 3, wind_speed_10m: 11.2, is_day: 1 }, daily: { temperature_2m_max: [25.4], temperature_2m_min: [14.5] } };
  assert.deepEqual(lerClima(ok), { temp: 22, codigo: 3, max: 25, min: 15, vento: 11, dia: true });
  assert.equal(lerClima(null), null);
  assert.equal(lerClima({ current: { temperature_2m: "x" }, daily: {} }), null);
  assert.equal(lerClima({ ...ok, daily: { temperature_2m_max: [], temperature_2m_min: [1] } }), null);
});
test("lerLugares: nome, região e limite de 5", () => {
  const r = lerLugares({ results: Array.from({ length: 8 }, (_, i) => ({ name: `Cidade ${i}`, admin1: "RS", latitude: -30 - i, longitude: -51 })).concat([{ name: "Sem ponto" }]) });
  assert.equal(r.length, 5);
  assert.equal(r[0].nome, "Cidade 0, RS");
  assert.deepEqual(lerLugares(undefined), []);
});
test("angulosDoRelogio: ponteiros", () => {
  assert.deepEqual(angulosDoRelogio(new Date(2026, 0, 1, 3, 0)), { hora: 90, minuto: 0 });
  assert.deepEqual(angulosDoRelogio(new Date(2026, 0, 1, 12, 30)), { hora: 15, minuto: 180 });
});
test("horaDoEvento: dia todo, hoje e amanhã", () => {
  const agora = new Date(2026, 5, 10, 8, 0);
  assert.equal(horaDoEvento({ titulo: "x", inicio: 0, fim: 0, diaTodo: true }, agora), "Dia todo");
  assert.match(horaDoEvento({ titulo: "x", inicio: new Date(2026, 5, 10, 14, 30).getTime(), fim: 0, diaTodo: false }, agora), /14:30/);
  assert.match(horaDoEvento({ titulo: "x", inicio: new Date(2026, 5, 11, 9, 0).getTime(), fim: 0, diaTodo: false }, agora), /^amanhã 09:00/);
});
