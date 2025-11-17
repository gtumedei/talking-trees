// WeatherContextBuilder.ts
// Classe unica con metodo statico generateReflection(lat, lon)
// Produce dataset + analisi + riflessioni in terza persona

export class WeatherContextBuilder {
  static baseUrlMeteo = "https://api.open-meteo.com/v1/forecast";
  static baseUrlAir = "https://air-quality-api.open-meteo.com/v1/air-quality";
  static archiveUrl = "https://archive-api.open-meteo.com/v1/era5";

  // =====================================================
  // FETCH DATI
  // =====================================================
  private static async fetchHourly7Days(lat: number, lon: number) {
    const meteo = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly:
        "temperature_2m,relative_humidity_2m,dewpoint_2m,windspeed_10m,winddirection_10m,precipitation,pressure_msl,uv_index",
      timezone: "Europe/Rome",
      past_days: "7",
    });

    const air = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      hourly:
        "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index",
      timezone: "Europe/Rome",
      past_days: "7",
    });

    const [m, a] = await Promise.all([
      fetch(`${this.baseUrlMeteo}?${meteo}`),
      fetch(`${this.baseUrlAir}?${air}`),
    ]);

    return {
      hourly: (await m.json()).hourly,
      air: (await a.json()).hourly,
    };
  }

  private static async fetchDailyArchive(lat: number, lon: number, years: number) {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - years);

    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
      daily:
        "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean",
      timezone: "Europe/Rome",
    });

    const res = await fetch(`${this.archiveUrl}?${params}`);
    return res.json();
  }

  private static aggregateMonthly(daily: any) {
    if (!daily?.daily?.time) return { time: [] };

    const { time, ...metrics } = daily.daily;
    const monthly: Record<string, Record<string, { sum: number; count: number }>> = {};
    for (const m of Object.keys(metrics)) monthly[m] = {};

    time.forEach((d: string, idx: number) => {
      const date = new Date(d);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      for (const m of Object.keys(metrics)) {
        if (!monthly[m][key]) monthly[m][key] = { sum: 0, count: 0 };

        const v = metrics[m][idx];
        if (v !== null && v !== undefined) {
          monthly[m][key].sum += v;
          monthly[m][key].count++;
        }
      }
    });

    const result: any = {
      time: Object.keys(monthly[Object.keys(monthly)[0]]),
    };

    for (const m of Object.keys(metrics)) {
      result[m] = result.time.map((t: string) => {
        const info = monthly[m][t];
        if (!info || info.count === 0) return null;
        return info.sum / info.count;
      });
    }

    return result;
  }

  // =====================================================
  // STATISTICHE
  // =====================================================
  private static avg(arr?: (number | null)[]) {
    if (!arr || arr.length === 0) return 0;
    const v = arr.filter((x) => x !== null && x !== undefined) as number[];
    return v.reduce((a, b) => a + b, 0) / v.length;
  }

  private static sum(arr?: (number | null)[]) {
    if (!arr) return 0;
    return arr.reduce((a: number, b) => a + (b ?? 0), 0);
  }

  private static max(arr?: (number | null)[]) {
    const v = arr?.filter((x) => x !== null) as number[];
    return v?.length ? Math.max(...v) : 0;
  }

  private static min(arr?: (number | null)[]) {
    const v = arr?.filter((x) => x !== null) as number[];
    return v?.length ? Math.min(...v) : 0;
  }

  private static std(arr?: (number | null)[]) {
    if (!arr) return 0;
    const mean = this.avg(arr);
    const diffs = arr.map((v) => Math.pow((v ?? 0) - mean, 2));
    return Math.sqrt(this.avg(diffs));
  }

  // =====================================================
  // ANALISI ANNUALE
  // =====================================================
  private static analyzeYear(year: any) {
    const tMean = this.avg(year.daily.temperature_2m_mean);
    const tMax = this.max(year.daily.temperature_2m_max);
    const tMin = this.min(year.daily.temperature_2m_min);

    return {
      temperature: {
        mean: tMean,
        max: tMax,
        min: tMin,
        std: this.std(year.daily.temperature_2m_mean),
      },
      humidity: this.avg(year.daily.relative_humidity_2m_mean),
      precipitation: this.sum(year.daily.precipitation_sum),
    };
  }

  // =====================================================
  // ANALISI SETTIMANA + DECADE
  // =====================================================
  private static analyzeAirQuality(aq: any) {
    if (!aq) return 80;

    const pm2 = this.avg(aq.pm2_5);
    let score = 100;

    if (pm2 > 50) score -= 30;
    else if (pm2 > 35) score -= 20;
    else if (pm2 > 20) score -= 10;

    return score;
  }

  private static analyzeTrends(week: any, decade: any, year: any) {
    const m: string[] = [];

    // Precipitazioni — settimana vs anno vs decade
    const p = week.precipitation;
    const pY = year.precipitation / 52;
    const pD = decade.precipitation;

    if (p > pY * 3) m.push(`Nell’ultima settimana si sono registrate precipitazioni molto superiori alla media annuale: ${p.toFixed(1)} mm contro una media settimanale di ${pY.toFixed(1)} mm.`);
    else if (p < pY * 0.3) m.push(`La settimana è stata insolitamente secca rispetto ai valori medi dell'anno: ${p.toFixed(1)} mm contro ${pY.toFixed(1)} mm attesi.`);

    if (p > pD * 4) m.push(`Le piogge registrate superano in modo anomalo anche i valori climatici di riferimento del decennio: ${p.toFixed(1)} mm rispetto alla media settimanale decennale di ${(pD).toFixed(1)} mm.`);
    if (p < pD * 0.25) m.push(`Le precipitazioni risultano anche inferiori alla media decennale: ${p.toFixed(1)} mm contro ${(pD).toFixed(1)} mm.`);

    // Temperature — settimana vs anno vs decade
    const tW = week.temperature.mean;
    const tY = year.temperature.mean;
    const tD = decade.temp_mean;

    if (tW - tY > 4) m.push(`Le temperature settimanali risultano decisamente più alte della media annuale: ${tW.toFixed(1)} °C contro ${tY.toFixed(1)} °C.`);
    if (tW - tY < -4) m.push(`Le temperature della settimana sono nettamente più basse rispetto alla media annuale: ${tW.toFixed(1)} °C contro ${tY.toFixed(1)} °C.`);
    if (tW - tD > 3)  m.push(`La settimana è stata più calda anche rispetto al clima di riferimento del decennio: ${tW.toFixed(1)} °C contro ${tD.toFixed(1)} °C.`);
    if (tW - tD < -3) m.push(`Le temperature settimanali sono inferiori ai valori tipici del decennio: ${tW.toFixed(1)} °C rispetto a ${tD.toFixed(1)} °C.`);

    return m;
  }

  private static analyzeDecade(ten: any, week: any) {
    try {
      const last = new Date(week.time[week.time.length - 1]);
      const month = last.getMonth() + 1;

      const filter = (arr: number[]) =>
        arr.filter((_: any, i: number) => new Date(ten.time[i]).getMonth() + 1 === month);

      return {
        temp_mean: this.avg(filter(ten.temperature_2m_mean) || ten.temperature_2m_mean),
        humidity: this.avg(filter(ten.relative_humidity_2m_mean) || ten.relative_humidity_2m_mean),
        precipitation: this.avg(filter(ten.precipitation_sum) || ten.precipitation_sum),
      };
    } catch {
      return {
        temp_mean: this.avg(ten.temperature_2m_mean),
        humidity: this.avg(ten.relative_humidity_2m_mean),
        precipitation: this.avg(ten.precipitation_sum),
      };
    }
  }

  private static analyzeWeek(week: any, aq: any) {
    return {
      temperature: {
        mean: this.avg(week.temperature_2m),
        max: this.max(week.temperature_2m),
        min: this.min(week.temperature_2m),
        std: this.std(week.temperature_2m),
      },
      humidity: this.avg(week.relative_humidity_2m),
      precipitation: this.sum(week.precipitation),
      wind: {
        mean: this.avg(week.windspeed_10m),
        max: this.max(week.windspeed_10m),
      },
      pressure: this.avg(week.pressure_msl),
      airQualityScore: this.analyzeAirQuality(aq),
    };
  }

  // =====================================================
  // GENERAZIONE DEL TESTO
  // =====================================================
  private static buildReflection(week: any, year: any, decade: any, trends: string[]) {
    const parts: string[] = [];

    // ================= TEMPERATURE =================
    const t = week.temperature.mean;

    if (t > 38)
      parts.push(`Le temperature estremamente elevate della settimana (${t.toFixed(1)}°C) possono aver causato un’eccessiva traspirazione e un marcato stress idrico per l’albero.`);
    else if (t > 32)
      parts.push(`La settimana è stata caratterizzata da temperature alte (${t.toFixed(1)}°C) che potrebbero aver aumentato il fabbisogno idrico dell’albero.`);
    else if (t > 25)
      parts.push(`Le temperature moderatamente elevate (${t.toFixed(1)}°C) suggeriscono condizioni favorevoli alla crescita, purché l’umidità sia stata adeguata.`);
    else if (t > 10)
      parts.push(`Le temperature miti (${t.toFixed(1)}°C) risultano generalmente positive per i processi fisiologici dell’albero.`);
    else if (t > 0)
      parts.push(`La settimana ha mostrato temperature basse ma non estreme (${t.toFixed(1)}°C), potenzialmente rallentando i processi metabolici dell’albero.`);
    else
      parts.push(`Le temperature rigide (${t.toFixed(1)}°C) indicano condizioni di gelo che possono aver danneggiato gemme e tessuti giovani.`);

    // ================= PRECIPITAZIONI =================
    const p = week.precipitation;

    if (p === 0)
      parts.push(`L’assenza totale di precipitazioni (0 mm) indica un periodo secco che può aver ridotto la disponibilità idrica nel suolo.`);
    else if (p < 5)
      parts.push(`Le precipitazioni leggere (${p.toFixed(1)} mm) non sono state probabilmente sufficienti a reintegrare completamente l’umidità del terreno.`);
    else if (p < 20)
      parts.push(`Le piogge moderate (${p.toFixed(1)} mm) possono aver garantito un buon apporto idrico, utile alla stabilità fisiologica dell’albero.`);
    else if (p < 60)
      parts.push(`Le piogge abbondanti (${p.toFixed(1)} mm) possono aver arricchito il suolo, favorendo le riserve idriche dell’apparato radicale.`);
    else
      parts.push(`Le precipitazioni eccezionalmente intense (${p.toFixed(1)} mm) potrebbero aver saturato il suolo, con potenziale rischio di ristagni dannosi.`);

    // ================= UMIDITÀ =================
    const h = week.humidity;

    if (h < 35)
      parts.push(`L’umidità molto bassa (${h}%) può aver favorito disidratazione fogliare e stress idrico.`);
    else if (h < 55)
      parts.push(`L’umidità moderata (${h}%) suggerisce condizioni tendenzialmente secche ma non critiche.`);
    else if (h < 75)
      parts.push(`L’umidità elevata (${h}%) ha probabilmente sostenuto i processi fotosintetici senza particolari difficoltà.`);
    else
      parts.push(`L’umidità molto alta (${h}%) può aver incrementato il rischio di patogeni fungini, influenzando la salute dell’albero.`);

    // ================= VENTO =================
    const w = week.wind.max;

    if (w > 70)
      parts.push(`Raffiche di vento molto intense (${w} km/h) potrebbero aver causato stress meccanico o rotture nei rami più esposti.`);
    else if (w > 40)
      parts.push(`Il vento sostenuto (${w} km/h) può aver contribuito a una maggiore evaporazione e stress idrico.`);
    else if (w > 20)
      parts.push(`Il vento moderato (${w} km/h) non rappresenta generalmente un fattore critico, salvo condizioni di siccità.`);
    else
      parts.push(`Il vento debole (${w} km/h) suggerisce un ambiente stabile e non stressante dal punto di vista aerodinamico.`);

    // ================= PRESSIONE =================
    parts.push(`La pressione atmosferica media della settimana si è attestata su ${week.pressure.toFixed(0)} hPa, indicatore utile per comprendere la stabilità delle masse d’aria.`);

    // ================= QUALITÀ DELL’ARIA =================
    const aqs = week.airQualityScore;

    if (aqs > 90)
      parts.push(`L’aria particolarmente pulita (indice ${aqs}) ha favorito gli scambi gassosi e la respirazione fogliare.`);
    else if (aqs > 70)
      parts.push(`La qualità dell’aria buona (indice ${aqs}) suggerisce condizioni favorevoli alla fotosintesi.`);
    else if (aqs > 50)
      parts.push(`La qualità dell’aria mediocre (indice ${aqs}) può aver ridotto leggermente l’efficienza fotosintetica.`);
    else
      parts.push(`L’aria di scarsa qualità (indice ${aqs}) potrebbe aver ostacolato i processi fotosintetici e respiratori dell’albero.`);

    // ================= TREND CLIMATICI =================
    parts.push(...trends);

    // ================= ANALISI ANNUALE =================
    parts.push(
      `Osservando i dati dell’ultimo anno, le temperature medie annuali (${year.temperature.mean.toFixed(1)}°C), la precipitazione totale annuale (${year.precipitation.toFixed(1)} mm) e l’umidità (${Math.round(year.humidity)}%) delineano il contesto climatico recente a cui l'albero è stato esposto.`
    );

    // ================= ANALISI DECENNALE =================
    parts.push(
      `Nel quadro climatico degli ultimi dieci anni, si osservano valori medi pari a ${decade.temp_mean.toFixed(1)}°C per la temperatura, ${decade.precipitation.toFixed(1)} mm per le precipitazioni e un’umidità del ${Math.round(decade.humidity)}%. Questi dati aiutano a interpretare come l’albero abbia reagito a lungo termine a eventuali variazioni climatiche.`
    );

    return parts.join("\n");
  }


  // =====================================================
  // METODO FINALE
  // =====================================================
  static async generateReflection(lat: number, lon: number): Promise<string> {
    const weekData = await this.fetchHourly7Days(lat, lon);
    const yearData = await this.fetchDailyArchive(lat, lon, 1);
    const decadeRaw = await this.fetchDailyArchive(lat, lon, 10);
    const decadeMonthly = this.aggregateMonthly(decadeRaw);

    const week = this.analyzeWeek(weekData.hourly, weekData.air);
    const year = this.analyzeYear(yearData);
    const decade = this.analyzeDecade(decadeMonthly, weekData.hourly);

    const trends = this.analyzeTrends(week, decade, year);

    return this.buildReflection(week, year, decade, trends);
  }
}
