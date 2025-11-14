// ./services/WeatherContextBuilder.ts

export interface HourlyData {
  time?: string[];
  temperature_2m?: number[];
  relative_humidity_2m?: number[];
  dewpoint_2m?: number[];
  windspeed_10m?: number[];
  winddirection_10m?: number[];
  precipitation?: number[];
  pressure_msl?: number[];
  uv_index?: number[];
  [key: string]: any;
}

export interface DailyData {
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    temperature_2m_mean?: number[];
    precipitation_sum?: number[];
    relative_humidity_2m_mean?: number[];
    [key: string]: any;
  };
}

export interface MonthlyAggregated {
  time: string[];
  [metric: string]: string[] | (number | null)[];
}

export interface WeatherBundle {
  hourlyData: HourlyData;
  dailyLastYear: DailyData;
  monthly10Years: MonthlyAggregated;
}

class WeatherService {
  baseUrlMeteo = "https://api.open-meteo.com/v1/forecast";
  baseUrlAir = "https://air-quality-api.open-meteo.com/v1/air-quality";
  archiveUrl = "https://archive-api.open-meteo.com/v1/era5";

  async fetchHourlyLast7Days(lat: number, lon: number): Promise<HourlyData> {
    try {
      const meteoParams = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly:
          "temperature_2m,relative_humidity_2m,dewpoint_2m,windspeed_10m,winddirection_10m,precipitation,pressure_msl",
        timezone: "Europe/Rome",
        past_days: "7",
      });

      const airParams = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly:
          "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index",
        timezone: "Europe/Rome",
        past_days: "7",
      });

      const [meteoResponse, airResponse] = await Promise.all([
        fetch(`${this.baseUrlMeteo}?${meteoParams}`),
        fetch(`${this.baseUrlAir}?${airParams}`),
      ]);

      if (!meteoResponse.ok || !airResponse.ok) {
        throw new Error("Errore nel fetch dei dati meteo");
      }

      const meteoData = await meteoResponse.json();
      const airData = await airResponse.json();

      return {
        ...meteoData,
        air_quality: airData.hourly,
      };
    } catch (error) {
      console.error("Errore nel fetch dei dati orari:", error);
      throw error;
    }
  }

  async fetchDailyLastYear(lat: number, lon: number): Promise<DailyData> {
    try {
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        start_date: oneYearAgo.toISOString().split("T")[0],
        end_date: today.toISOString().split("T")[0],
        daily:
          "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean",
        timezone: "Europe/Rome",
      });

      const response = await fetch(`${this.archiveUrl}?${params}`);

      if (!response.ok) {
        throw new Error("Errore nel fetch dei dati annuali");
      }

      return await response.json();
    } catch (error) {
      console.error("Errore nel fetch dei dati annuali:", error);
      throw error;
    }
  }

  async fetchDailyLast10Years(lat: number, lon: number): Promise<DailyData> {
    try {
      const today = new Date();
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(today.getFullYear() - 10);

      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        start_date: tenYearsAgo.toISOString().split("T")[0],
        end_date: today.toISOString().split("T")[0],
        daily:
          "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean",
        timezone: "Europe/Rome",
      });

      const response = await fetch(`${this.archiveUrl}?${params}`);

      if (!response.ok) {
        throw new Error("Errore nel fetch dei dati decennali");
      }

      return await response.json();
    } catch (error) {
      console.error("Errore nel fetch dei dati decennali:", error);
      throw error;
    }
  }

  aggregateMonthly(dailyData: DailyData): MonthlyAggregated {
    if (!dailyData?.daily?.time) return { time: [] };

    const { time, ...metrics } = dailyData.daily;

    // Struttura interna temporanea per aggregare
    type TempMonth = {
      sum: number;
      count: number;
      values: number[];
    };

    const monthly: Record<
      string,
      Record<string, TempMonth>
    > = {};

    // inizializza struttura
    for (const metric of Object.keys(metrics)) {
      monthly[metric] = {};
    }

    time.forEach((dateString: string, index: number) => {
      const date = new Date(dateString);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      for (const metric of Object.keys(metrics)) {

        if (!monthly[metric][yearMonth]) {
          monthly[metric][yearMonth] = { sum: 0, count: 0, values: [] };
        }

        const value = metrics[metric]?.[index];

        if (value !== null && value !== undefined) {
          monthly[metric][yearMonth].sum += value;
          monthly[metric][yearMonth].count++;
          monthly[metric][yearMonth].values.push(value);
        }
      }
    });

    // === RISULTATO ===

    const result: MonthlyAggregated = {
      time: Object.keys(monthly[Object.keys(monthly)[0]])
    };

    for (const metric of Object.keys(metrics)) {
      result[metric] = result.time.map((ym) => {
        const month = monthly[metric][ym];
        return month && month.count > 0
          ? month.sum / month.count
          : null;
      });
    }

    return result;
  }


  async getAllWeatherData(lat: number, lon: number): Promise<WeatherBundle> {
    try {
      const hourlyData = await this.fetchHourlyLast7Days(lat, lon);
      const dailyLastYear = await this.fetchDailyLastYear(lat, lon);
      const daily10Years = await this.fetchDailyLast10Years(lat, lon);
      const monthly10Years = this.aggregateMonthly(daily10Years);

      return {
        hourlyData,
        dailyLastYear,
        monthly10Years,
      };
    } catch (error) {
      console.error("Errore totale:", error);
      throw error;
    }
  }
}

class WiseTree {
  week: HourlyData;
  lastYear: DailyData;
  tenYears: MonthlyAggregated;

  constructor(week: HourlyData, lastYear: DailyData, tenYears: MonthlyAggregated) {
    this.week = week;
    this.lastYear = lastYear;
    this.tenYears = tenYears;
  }

  // ===== Utility numeriche =====
  private _avg(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    const nums = arr.map((v) => v ?? 0);
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  private _max(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    return Math.max(...arr.filter((v) => v !== null && v !== undefined) as number[]);
  }

  private _min(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    return Math.min(...arr.filter((v) => v !== null && v !== undefined) as number[]);
  }

  private _sum(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce<number>((acc, v) => acc + (v ?? 0), 0);
  }


  private _std(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    const mean = this._avg(arr);
    const squareDiffs = arr.map((v) => Math.pow((v ?? 0) - mean, 2));
    return Math.sqrt(this._avg(squareDiffs));
  }

  // ====== Analisi principale =======
  private _analyzeWeek() {
    const h = this.week.hourly ?? this.week;

    const stats = {
      temperature: {
        mean: this._avg(h.temperature_2m),
        max: this._max(h.temperature_2m),
        min: this._min(h.temperature_2m),
        std: this._std(h.temperature_2m),
      },
      humidity: this._avg(h.relative_humidity_2m),
      precipitation: this._sum(h.precipitation),
      wind: {
        mean: this._avg(h.windspeed_10m),
        max: this._max(h.windspeed_10m),
      },
      pressure: this._avg(h.pressure_msl),
      dewpoint: this._avg(h.dewpoint_2m),
      air_quality: this._analyzeAirQualityScore(),
      uv: h.uv_index ? this._avg(h.uv_index) : null,
    };

    return stats;
  }

  private _analyzeDecade() {
    try {
      const currentMonth = new Date(
        this.week.hourly?.time?.slice(-1)?.[0] ?? ""
      ).getMonth() + 1;

      const monthFilter = (arr?: number[]) =>
        arr?.filter((_, i) => {
          const date = new Date(this.tenYears.time[i]);
          return date.getMonth() + 1 === currentMonth;
        }) ?? [];

      const temp = monthFilter(this.tenYears.temperature_2m_mean as number[]);
      const hum = monthFilter(this.tenYears.relative_humidity_2m_mean as number[]);
      const prec = monthFilter(this.tenYears.precipitation_sum as number[]);

      return {
        temp_mean: this._avg(temp.length ? temp : (this.tenYears.temperature_2m_mean as number[])),
        humidity: this._avg(hum.length ? hum : (this.tenYears.relative_humidity_2m_mean as number[])),
        precipitation: this._avg(prec.length ? prec : (this.tenYears.precipitation_sum as number[])),
      };
    } catch (e) {
      return {
        temp_mean: this._avg(this.tenYears.temperature_2m_mean as number[]),
        humidity: this._avg(this.tenYears.relative_humidity_2m_mean as number[]),
        precipitation: this._avg(this.tenYears.precipitation_sum as number[]),
      };
    }
  }

  private _analyzeAirQualityScore() {
    const a = this.week.air_quality ?? {};
    const pollutants = ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"];

    const valid = pollutants.filter((p) => a[p] && a[p].length > 0);
    if (valid.length === 0) return null;

    let score = 100;

    if (a.pm2_5) {
      const v = this._avg(a.pm2_5);
      if (v > 50) score -= 25;
      else if (v > 35) score -= 20;
      else if (v > 25) score -= 15;
      else if (v > 15) score -= 10;
    }

    return Math.max(score, 0);
  }

  private _calculateDryDays() {
    const arr = this.week.hourly?.precipitation ?? [];
    let dryHours = 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if ((arr[i] ?? 0) > 0.5) break;
      dryHours++;
    }
    return Math.ceil(dryHours / 24);
  }

  private _analyzeHydration(week: any, dec: any) {
    const p = week.precipitation;
    const h = week.humidity;
    const p_norm = dec.precipitation;

    const dry = this._calculateDryDays();

    if (p === 0 && h < 40)
      return `Ho sete, non piove da ${dry} giorni e l'umidità è solo al ${Math.round(h)}%.`;

    if (p > p_norm * 3)
      return `Sono zuppo! Questa settimana ${p.toFixed(1)}mm di pioggia, molto sopra la media.`;

    return `Sto bene, l'umidità è al ${Math.round(h)}%.`;
  }

  private _analyzeTemperature(week: any, dec: any) {
    const t = week.temperature.mean;
    const t_norm = dec.temp_mean;

    if (t > 35) return `Sto soffrendo il caldo: ${t.toFixed(1)}°C.`;
    if (t < 0) return `Fa gelissimo: ${t.toFixed(1)}°C.`;

    if (t > t_norm + 5)
      return `Fa molto più caldo del normale: ${t.toFixed(1)}°C contro ${t_norm.toFixed(1)}°C.`;

    if (t < t_norm - 5)
      return `Fa più freddo del solito: ${t.toFixed(1)}°C invece di ${t_norm.toFixed(1)}°C.`;

    return `La temperatura di ${t.toFixed(1)}°C mi sta bene.`;
  }

  private _analyzeHumidityPressure(week: any) {
    const h = week.humidity;
    const p = week.pressure;

    if (p < 1005) return `Pressione bassa (${p.toFixed(0)}hPa), mi sento pesante.`;
    if (p > 1025) return `Pressione alta (${p.toFixed(0)}hPa), aria frizzante.`;

    if (h > 85) return `Umidità alta (${Math.round(h)}%).`;
    if (h < 40) return `Aria secca (${Math.round(h)}%).`;

    return `Umidità piacevole (${Math.round(h)}%).`;
  }

  private _analyzeWind(week: any) {
    const w = week.wind.mean;
    const wmax = week.wind.max;

    if (wmax > 50) return `Raffiche molto forti (${Math.round(wmax)}km/h)!`;
    if (wmax > 30) return `Vento sostenuto (${Math.round(wmax)}km/h).`;
    if (w > 15) return `Vento teso (${w.toFixed(1)}km/h).`;
    if (w > 5) return `Brezza (${w.toFixed(1)}km/h).`;

    return `Quasi nessun vento.`;
  }

  private _analyzeAirQuality(score: number | null) {
    if (score === null) return "Dati insufficienti sulla qualità dell'aria.";
    if (score > 90) return "Aria ottima!";
    if (score > 70) return "Aria discreta.";
    if (score > 50) return "Aria non buona.";
    return "Aria molto inquinata.";
  }

  private _analyzeSolarRadiation(week: any) {
    if (week.uv == null) return null;

    const uv = week.uv;

    if (uv > 8) return `UV molto alti (${uv.toFixed(1)}).`;
    if (uv > 5) return `UV intensi (${uv.toFixed(1)}).`;

    return `UV moderati (${uv.toFixed(1)}).`;
  }

  private _analyzeWeekTrend(week: any, dec: any) {
    const messages: string[] = [];

    const p = week.precipitation;
    const p_avg = dec.precipitation;

    if (p_avg > 0) {
      const ratio = (p / p_avg) * 100;

      if (ratio > 300) messages.push(`Settimana estremamente piovosa (+${Math.round(ratio)}%).`);
      else if (ratio > 150) messages.push(`Più pioggia del solito.`);
      else if (ratio < 50) messages.push(`Molto meno pioggia del normale.`);
    }

    const tempDiff = week.temperature.mean - dec.temp_mean;

    if (Math.abs(tempDiff) > 3) {
      if (tempDiff > 0)
        messages.push(`Molto più caldo del solito (+${tempDiff.toFixed(1)}°C).`);
      else
        messages.push(`Molto più freddo del solito (${tempDiff.toFixed(1)}°C).`);
    }

    return messages;
  }

  generateReflection() {
    const week = this._analyzeWeek();
    const dec = this._analyzeDecade();

    const msgs = [
      this._analyzeHydration(week, dec),
      this._analyzeTemperature(week, dec),
      this._analyzeHumidityPressure(week),
      this._analyzeWind(week),
      this._analyzeAirQuality(week.air_quality),
    ];

    const rad = this._analyzeSolarRadiation(week);
    if (rad) msgs.push(rad);

    const trend = this._analyzeWeekTrend(week, dec);
    msgs.push(...trend);

    return msgs.join(" ");
  }
}

// ==========================
// Funzione principale
// ==========================

export async function weatherReflection(latitude: number, longitude: number): Promise<string> {
  try {
    const weatherService = new WeatherService();
    const weatherData = await weatherService.getAllWeatherData(latitude, longitude);

    const wiseTree = new WiseTree(
      weatherData.hourlyData,
      weatherData.dailyLastYear,
      weatherData.monthly10Years
    );

    return wiseTree.generateReflection();
  } catch (error: any) {
    console.error("Errore nella riflessione:", error);
    return `Errore nella generazione della riflessione: ${error.message}`;
  }
}
