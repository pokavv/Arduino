/**
 * DHT11 / DHT22 라이브러리 목 (JS 코드 문자열 반환)
 * 시뮬레이션 런타임 내부의 AsyncFunction에서 eval됨
 */
export function dhtMock(): string {
  return `
// ─── DHT 라이브러리 목 ──────────────────────────────────────
const DHT11 = 11, DHT22 = 22, DHT21 = 21;
class DHT {
  constructor(pin, type) {
    this._pin = +pin;
    this._type = type;
    const c = _gpioToComp?.get(this._pin);
    this._id = c?.id ?? null;
  }
  begin() {}
  read(force = false) { return true; }
  readTemperature(isFahrenheit = false, force = false) {
    const t = (_ctx[\`__dht_temp_\${this._id}\`] ?? 25.0);
    return isFahrenheit ? t * 9.0 / 5.0 + 32 : t;
  }
  readHumidity(force = false) {
    return (_ctx[\`__dht_hum_\${this._id}\`] ?? 60.0);
  }
  computeHeatIndex(temp, hum, isFahrenheit = false) {
    const t = isFahrenheit ? temp : temp * 9.0/5.0 + 32;
    const hi = -42.379 + 2.04901523*t + 10.14333127*hum
               -0.22475541*t*hum - 0.00683783*t*t - 0.05481717*hum*hum;
    return isFahrenheit ? hi : (hi - 32) * 5.0/9.0;
  }
  isnan(v) { return isNaN(v); }
}
`;
}
