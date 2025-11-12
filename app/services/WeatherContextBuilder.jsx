//./services/WeatherContextBuilder.jsx

class WeatherService {
  constructor() {
    this.baseUrlMeteo = "https://api.open-meteo.com/v1/forecast";
    this.baseUrlAir = "https://air-quality-api.open-meteo.com/v1/air-quality";
    this.archiveUrl = "https://archive-api.open-meteo.com/v1/era5";
  }

  async fetchHourlyLast7Days(lat, lon) {
    try {
      const meteoParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,relative_humidity_2m,dewpoint_2m,windspeed_10m,winddirection_10m,precipitation,pressure_msl',
        timezone: 'Europe/Rome',
        past_days: 7
      });

      const airParams = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index',
        timezone: 'Europe/Rome',
        past_days: 7
      });

      const [meteoResponse, airResponse] = await Promise.all([
        fetch(`${this.baseUrlMeteo}?${meteoParams}`),
        fetch(`${this.baseUrlAir}?${airParams}`)
      ]);

      if (!meteoResponse.ok || !airResponse.ok) {
        throw new Error('Errore nel fetch dei dati meteo');
      }

      const meteoData = await meteoResponse.json();
      const airData = await airResponse.json();

      return {
        ...meteoData,
        air_quality: airData.hourly
      };
    } catch (error) {
      console.error('Errore nel fetch dei dati orari:', error);
      throw error;
    }
  }

  async fetchDailyLastYear(lat, lon) {
    try {
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const startDate = oneYearAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean',
        timezone: 'Europe/Rome'
      });

      const response = await fetch(`${this.archiveUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error('Errore nel fetch dei dati annuali');
      }

      return await response.json();
    } catch (error) {
      console.error('Errore nel fetch dei dati annuali:', error);
      throw error;
    }
  }

  async fetchDailyLast10Years(lat, lon) {
    try {
      const today = new Date();
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(today.getFullYear() - 10);

      const startDate = tenYearsAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        start_date: startDate,
        end_date: endDate,
        daily: 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,relative_humidity_2m_mean',
        timezone: 'Europe/Rome'
      });

      const response = await fetch(`${this.archiveUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error('Errore nel fetch dei dati decennali');
      }

      return await response.json();
    } catch (error) {
      console.error('Errore nel fetch dei dati decennali:', error);
      throw error;
    }
  }

  aggregateMonthly(dailyData) {
    if (!dailyData || !dailyData.daily || !dailyData.daily.time) {
      return {};
    }

    const monthlyData = {};
    const { time, ...metrics } = dailyData.daily;

    Object.keys(metrics).forEach(metric => {
      monthlyData[metric] = {};
    });

    time.forEach((dateString, index) => {
      const date = new Date(dateString);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      Object.keys(metrics).forEach(metric => {
        if (!monthlyData[metric][yearMonth]) {
          monthlyData[metric][yearMonth] = {
            sum: 0,
            count: 0,
            values: []
          };
        }

        const value = metrics[metric][index];
        if (value !== null && value !== undefined) {
          monthlyData[metric][yearMonth].sum += value;
          monthlyData[metric][yearMonth].count++;
          monthlyData[metric][yearMonth].values.push(value);
        }
      });
    });

    const result = { time: Object.keys(monthlyData.temperature_2m_mean || {}) };
    
    Object.keys(metrics).forEach(metric => {
      result[metric] = result.time.map(yearMonth => {
        const monthData = monthlyData[metric][yearMonth];
        return monthData && monthData.count > 0 ? monthData.sum / monthData.count : null;
      });
    });

    return result;
  }

  async getAllWeatherData(lat, lon) {
    try {
      
      const hourlyData = await this.fetchHourlyLast7Days(lat, lon);
      const dailyLastYear = await this.fetchDailyLastYear(lat, lon);
      const daily10Years = await this.fetchDailyLast10Years(lat, lon);
      const monthly10Years = this.aggregateMonthly(daily10Years);

      return {
        hourlyData,
        dailyLastYear,
        monthly10Years
      };
    } catch (error) {
      console.error('Errore nel recupero di tutti i dati meteo:', error);
      throw error;
    }
  }
}

class WiseTree {
  constructor(weekData, lastYearData, tenYearsData) {
    this.week = weekData;
    this.lastYear = lastYearData;
    this.tenYears = tenYearsData;
  }

  _analyzeWeek() {
    const weekHourly = this.week.hourly || {};
    const stats = {
      temperature: {
        mean: this._calculateAverage(weekHourly.temperature_2m),
        max: this._calculateMax(weekHourly.temperature_2m),
        min: this._calculateMin(weekHourly.temperature_2m),
        std: this._calculateStd(weekHourly.temperature_2m)
      },
      humidity: this._calculateAverage(weekHourly.relative_humidity_2m),
      precipitation: this._calculateSum(weekHourly.precipitation),
      wind: {
        mean: this._calculateAverage(weekHourly.windspeed_10m),
        max: this._calculateMax(weekHourly.windspeed_10m)
      },
      pressure: this._calculateAverage(weekHourly.pressure_msl),
      dewpoint: this._calculateAverage(weekHourly.dewpoint_2m)
    };

    stats.air_quality = this._analyzeAirQualityScore();
    
    const airQuality = this.week.air_quality || {};
    stats.uv = airQuality.uv_index ? this._calculateAverage(airQuality.uv_index) : null;

    stats.temperature_range = stats.temperature.max - stats.temperature.min;
    stats.temp_dewpoint_diff = stats.temperature.mean - stats.dewpoint;

    return stats;
  }

  _analyzeDecade() {
    try {
      const weekTimes = this.week.hourly?.time || [];
      if (weekTimes.length === 0) {
        throw new Error('No time data available');
      }

      const lastDate = new Date(weekTimes[weekTimes.length - 1]);
      const currentMonth = lastDate.getMonth() + 1;

      const tenYearsTimes = this.tenYears.time || [];
      const monthlyData = {
        temperature_2m_mean: [],
        relative_humidity_2m_mean: [],
        precipitation_sum: []
      };

      tenYearsTimes.forEach((dateStr, index) => {
        const date = new Date(dateStr);
        if (date.getMonth() + 1 === currentMonth) {
          if (this.tenYears.temperature_2m_mean) monthlyData.temperature_2m_mean.push(this.tenYears.temperature_2m_mean[index]);
          if (this.tenYears.relative_humidity_2m_mean) monthlyData.relative_humidity_2m_mean.push(this.tenYears.relative_humidity_2m_mean[index]);
          if (this.tenYears.precipitation_sum) monthlyData.precipitation_sum.push(this.tenYears.precipitation_sum[index]);
        }
      });

      if (monthlyData.temperature_2m_mean.length === 0) {
        const last12 = {
          temperature_2m_mean: this.tenYears.temperature_2m_mean?.slice(-12) || [],
          relative_humidity_2m_mean: this.tenYears.relative_humidity_2m_mean?.slice(-12) || [],
          precipitation_sum: this.tenYears.precipitation_sum?.slice(-12) || []
        };
        return {
          temp_mean: this._calculateAverage(last12.temperature_2m_mean),
          humidity: this._calculateAverage(last12.relative_humidity_2m_mean),
          precipitation: this._calculateAverage(last12.precipitation_sum),
        };
      }

      return {
        temp_mean: this._calculateAverage(monthlyData.temperature_2m_mean),
        humidity: this._calculateAverage(monthlyData.relative_humidity_2m_mean),
        precipitation: this._calculateAverage(monthlyData.precipitation_sum),
      };
    } catch (error) {
      return {
        temp_mean: this._calculateAverage(this.tenYears.temperature_2m_mean),
        humidity: this._calculateAverage(this.tenYears.relative_humidity_2m_mean),
        precipitation: this._calculateAverage(this.tenYears.precipitation_sum),
      };
    }
  }

  _analyzeAirQualityScore() {
    const pollutants = ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"];
    const airQuality = this.week.air_quality || {};

    const availablePollutants = pollutants.filter(pollutant => 
      airQuality[pollutant] && airQuality[pollutant].length > 0
    );

    if (availablePollutants.length === 0) {
      return null;
    }

    let score = 100;

    availablePollutants.forEach(pollutant => {
      const avgValue = this._calculateAverage(airQuality[pollutant]);
      
      switch(pollutant) {
        case "pm2_5":
          if (avgValue > 50) score -= 25;
          else if (avgValue > 35) score -= 20;
          else if (avgValue > 25) score -= 15;
          else if (avgValue > 15) score -= 10;
          break;
        
        case "pm10":
          if (avgValue > 70) score -= 20;
          else if (avgValue > 50) score -= 15;
          else if (avgValue > 35) score -= 10;
          else if (avgValue > 20) score -= 5;
          break;
        
        case "ozone":
          if (avgValue > 120) score -= 15;
          else if (avgValue > 100) score -= 10;
          else if (avgValue > 80) score -= 5;
          break;
        
        case "nitrogen_dioxide":
          if (avgValue > 60) score -= 10;
          else if (avgValue > 40) score -= 5;
          break;
      }
    });

    return Math.max(score, 0);
  }

  _analyzeHydration(weekStats, decadeStats) {
    const p = weekStats.precipitation;
    const h = weekStats.humidity;
    const p_norm = decadeStats.precipitation;

    const dryDays = this._calculateDryDays();

    if (p === 0 && h < 40) {
      return `Ho sete, non piove da ${dryDays} giorni e l'umidità è solo al ${Math.round(h)}%.`;
    } else if (p === 0 && h < 50) {
      return `Sono assetato, non piove da ${dryDays} giorni.`;
    } else if (p > p_norm * 3) {
      const percent = ((p / p_norm) - 1) * 100;
      return `Sono zuppo! Questa settimana sono caduti ${p.toFixed(1)}mm di pioggia, il ${Math.round(percent)}% in più del normale.`;
    } else if (p > p_norm * 2) {
      return `Sono ben idratato con ${p.toFixed(1)}mm di pioggia questa settimana.`;
    } else if (p > 10) {
      return `Mi sento rinvigorito dopo ${p.toFixed(1)}mm di pioggia.`;
    } else if (p > 5) {
      return `La pioggia di ${p.toFixed(1)}mm di questa settimana mi ha dissetato.`;
    } else if (h > 80) {
      return `Mi sento ben idratato, l'umidità è al ${Math.round(h)}%.`;
    } else if (h < 50) {
      return `L'aria è secca, l'umidità è solo al ${Math.round(h)}%.`;
    } else {
      return `Sto bene, l'umidità è al ${Math.round(h)}%.`;
    }
  }

  _analyzeTemperature(weekStats, decadeStats) {
    const t = weekStats.temperature.mean;
    const t_min = weekStats.temperature.min;
    const t_max = weekStats.temperature.max;
    const t_norm = decadeStats.temp_mean;

    const range = t_max - t_min;

    if (t > 35) {
      return `Sto soffrendo il caldo, ${t.toFixed(1)}°C sono troppi per me.`;
    } else if (t > 30) {
      return `Fa caldo, ${t.toFixed(1)}°C mi stancano.`;
    } else if (t < 0) {
      return `Questo gelo mi fa male, ${t.toFixed(1)}°C sono pericolosi.`;
    } else if (t < 5) {
      return `Questo gelo mi fa sentire intorpidito e letargico, solo ${t.toFixed(1)}°C.`;
    } else if (t > t_norm + 5) {
      return `Fa molto più caldo del solito, ${t.toFixed(1)}°C invece dei ${t_norm.toFixed(1)}°C normali.`;
    } else if (t < t_norm - 5) {
      return `Fa molto più freddo del solito, ${t.toFixed(1)}°C invece dei ${t_norm.toFixed(1)}°C normali.`;
    } else if (range > 15) {
      return `Gli sbalzi di temperatura mi stressano, da ${t_min.toFixed(1)}°C a ${t_max.toFixed(1)}°C in un giorno.`;
    } else {
      return `La temperatura di ${t.toFixed(1)}°C mi sta bene.`;
    }
  }

  _analyzeHumidityPressure(weekStats) {
    const h = weekStats.humidity;
    const p = weekStats.pressure;

    if (p < 1005) {
      return `Sento l'aria pesante, la pressione è a ${p.toFixed(1)}hPa.`;
    } else if (p > 1025) {
      return `L'aria è leggera, la pressione è a ${p.toFixed(1)}hPa.`;
    } else if (h > 85) {
      return `L'umidità è alta al ${Math.round(h)}%, mi sento appiccicoso.`;
    } else if (h < 40) {
      return `L'aria è secca, solo ${Math.round(h)}% di umidità.`;
    } else {
      return `Respiro bene con ${Math.round(h)}% di umidità.`;
    }
  }

  _analyzeWind(weekStats) {
    const w = weekStats.wind.mean;
    const w_max = weekStats.wind.max;

    if (w_max > 50) {
      return `Il vento è fortissimo! Raffiche a ${Math.round(w_max)}km/h mi spaventano.`;
    } else if (w_max > 30) {
      return `Il vento è forte, ${Math.round(w_max)}km/h mi fanno tremare i rami.`;
    } else if (w > 15) {
      return `Il vento a ${w.toFixed(1)}km/h mi fa dondolare.`;
    } else if (w > 8) {
      return `Mi piego al vento, ma resisto forte e fiero. Vento a ${w.toFixed(1)}km/h.`;
    } else if (w > 3) {
      return `Una brezza piacevole di ${w.toFixed(1)}km/h mi accarezza.`;
    } else {
      return `Oggi non c'è vento, tutto è calmo.`;
    }
  }

  _analyzeAirQuality(score) {
    if (score === null) {
      return "Non so com'è l'aria oggi, non ho abbastanza dati.";
    }

    const airQuality = this.week.air_quality || {};
    const pollutantsData = {};
    
    ["pm2_5", "pm10", "ozone"].forEach(pollutant => {
      if (airQuality[pollutant] && airQuality[pollutant].length > 0) {
        pollutantsData[pollutant] = this._calculateAverage(airQuality[pollutant]);
      }
    });

    let details = "";
    if (pollutantsData.pm2_5 !== undefined) {
      details = ` PM2.5: ${pollutantsData.pm2_5.toFixed(1)}µg/m³`;
    } else if (pollutantsData.pm10 !== undefined) {
      details = ` PM10: ${pollutantsData.pm10.toFixed(1)}µg/m³`;
    }

    if (score > 90) {
      return `Respiro profondamente quest'aria incontaminata.${details}`;
    } else if (score > 80) {
      return `L'aria è buona oggi.${details}`;
    } else if (score > 70) {
      return `L'aria è discreta.${details}`;
    } else if (score > 60) {
      return `L'aria non è delle migliori.${details}`;
    } else if (score > 50) {
      return `L'aria è pesante, respiro a fatica.${details}`;
    } else {
      return `L'aria è troppo inquinata, mi fa male.${details}`;
    }
  }

  _analyzeSolarRadiation(weekStats) {
    if (weekStats.uv === null || weekStats.uv === undefined) {
      return null;
    }

    const uv = weekStats.uv;

    if (uv > 8) {
      return `Il sole è troppo forte, UV: ${uv.toFixed(1)} mi brucia.`;
    } else if (uv > 5) {
      return `Il sole è intenso, UV: ${uv.toFixed(1)} mi carica di energia.`;
    } else if (uv > 3) {
      return `Il sole è perfetto, UV: ${uv.toFixed(1)} mi fa bene.`;
    } else {
      return `Il sole è delicato, UV: ${uv.toFixed(1)} mi riscalda piacevolmente.`;
    }
  }

  _analyzeWeekTrend(weekStats, decadeStats) {
    const messages = [];

    const p_week = weekStats.precipitation;
    const p_avg = decadeStats.precipitation;

    if (p_avg > 0) {
      const rainRatio = (p_week / p_avg) * 100;
      if (rainRatio > 300) {
        messages.push(`Questa settimana ha piovuto tantissimo: ${p_week.toFixed(1)}mm, il ${Math.round(rainRatio)}% in più del normale.`);
      } else if (rainRatio > 150) {
        messages.push(`Questa settimana è piovuto più del solito: ${p_week.toFixed(1)}mm.`);
      } else if (rainRatio < 50) {
        messages.push(`Questa settimana è piovuto poco: ${p_week.toFixed(1)}mm, solo il ${Math.round(rainRatio)}% del normale.`);
      } else if (p_week === 0) {
        messages.push(`Questa settimana non è piovuto per niente.`);
      } else {
        messages.push(`Questa settimana sono caduti ${p_week.toFixed(1)}mm di pioggia.`);
      }
    }

    const tempDiff = weekStats.temperature.mean - decadeStats.temp_mean;
    if (Math.abs(tempDiff) > 3) {
      if (tempDiff > 0) {
        messages.push(`Fa più caldo del solito, +${tempDiff.toFixed(1)}°C rispetto alla media.`);
      } else {
        messages.push(`Fa più freddo del solito, ${tempDiff.toFixed(1)}°C rispetto alla media.`);
      }
    }

    return messages;
  }

  _calculateDryDays() {
    try {
      const precipitation = this.week.hourly?.precipitation || [];
      let dryDays = 0;
      
      for (let i = precipitation.length - 1; i >= 0; i--) {
        if (precipitation[i] > 0.5) {
          break;
        }
        dryDays++;
      }
      
      return Math.ceil(dryDays / 24);
    } catch (error) {
      return 7;
    }
  }

  _calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((acc, val) => acc + (val || 0), 0);
    return sum / arr.length;
  }

  _calculateMax(arr) {
    if (!arr || arr.length === 0) return 0;
    return Math.max(...arr.filter(val => val !== null && val !== undefined));
  }

  _calculateMin(arr) {
    if (!arr || arr.length === 0) return 0;
    return Math.min(...arr.filter(val => val !== null && val !== undefined));
  }

  _calculateStd(arr) {
    if (!arr || arr.length === 0) return 0;
    const avg = this._calculateAverage(arr);
    const squareDiffs = arr.map(val => Math.pow((val || 0) - avg, 2));
    const avgSquareDiff = this._calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  _calculateSum(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((acc, val) => acc + (val || 0), 0);
  }

  generateReflection() {
    const weekStats = this._analyzeWeek();
    const decadeStats = this._analyzeDecade();

    const messages = [];

    messages.push(this._analyzeHydration(weekStats, decadeStats));
    messages.push(this._analyzeTemperature(weekStats, decadeStats));
    messages.push(this._analyzeHumidityPressure(weekStats));
    messages.push(this._analyzeWind(weekStats));
    messages.push(this._analyzeAirQuality(weekStats.air_quality));

    const radiationMsg = this._analyzeSolarRadiation(weekStats);
    if (radiationMsg) {
      messages.push(radiationMsg);
    }

    const trendMessages = this._analyzeWeekTrend(weekStats, decadeStats);
    trendMessages.forEach(trendMsg => {
      messages.push(trendMsg);
    });

    let reflection = messages.join(' ');

    return reflection;
  }
}


// =============================================
// CLASSI DI SUPPORTO (mantenute per compatibilità)
// =============================================

/**
 * Versione JavaScript della classe AlberoSaggio (semplificata)
 */
class AlberoSaggio {
    constructor(week_df, lastyear_df, tenyears_df, nome_albero = "Albero Antico", specie = "Quercia") {
        this.week = week_df;
        this.lastyear = lastyear_df;
        this.tenyears = tenyears_df;
        this.nome = nome_albero;
        this.specie = specie;
    }

    _analizza_settimana() {
        const stats = {
            temperature: {
                mean: this._safeMean(this.week.temperature_2m),
                max: this._safeMax(this.week.temperature_2m),
                min: this._safeMin(this.week.temperature_2m),
                std: this._safeStd(this.week.temperature_2m)
            },
            humidity: this._safeMean(this.week.relative_humidity_2m),
            precipitation: this._safeSum(this.week.precipitation),
            wind: {
                mean: this._safeMean(this.week.windspeed_10m),
                max: this._safeMax(this.week.windspeed_10m)
            },
            pressure: this._safeMean(this.week.pressure_msl),
            dewpoint: this._safeMean(this.week.dewpoint_2m)
        };

        stats.air_quality = this._analizza_qualita_aria_punteggio();
        stats.uv = this.week.uv_index ? this._safeMean(this.week.uv_index) : null;

        stats.escursione_termica = stats.temperature.max - stats.temperature.min;
        stats.diff_temp_rugiada = stats.temperature.mean - stats.dewpoint;

        return stats;
    }

    _analizza_decennio() {
        try {
            return {
                temp_mean: this._safeMean(this.tenyears.temperature_2m_mean),
                humidity: this._safeMean(this.tenyears.relative_humidity_2m_mean),
                precipitation: this._safeMean(this.tenyears.precipitation_sum),
            };
        } catch (error) {
            return {
                temp_mean: this._safeMean(this.tenyears.temperature_2m_mean),
                humidity: this._safeMean(this.tenyears.relative_humidity_2m_mean),
                precipitation: this._safeMean(this.tenyears.precipitation_sum),
            };
        }
    }

    _analizza_qualita_aria_punteggio() {
        const inquinanti = ["pm10", "pm2_5", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"];
        const inquinanti_disponibili = inquinanti.filter(col => this.week[col]);

        if (inquinanti_disponibili.length === 0) return null;

        let punteggio = 100;

        if (this.week.pm2_5) {
            const pm25 = this._safeMean(this.week.pm2_5);
            if (pm25 > 50) punteggio -= 25;
            else if (pm25 > 35) punteggio -= 20;
            else if (pm25 > 25) punteggio -= 15;
            else if (pm25 > 15) punteggio -= 10;
        }

        return Math.max(punteggio, 0);
    }

    _analizza_idratazione(stats_sett) {
        const p = stats_sett.precipitation;
        const h = stats_sett.humidity;
        if (p === 0 && h < 40) {
            return `🌵 Ho sete, non piove da ${this._calcola_giorni_senza_pioggia()} giorni e l'umidità è solo al ${h.toFixed(0)}%.`;
        }
        return `💧 Sto bene, l'umidità è al ${h.toFixed(0)}%.`;
    }

    _analizza_temperatura(stats_sett) {
        const t = stats_sett.temperature.mean;

        if (t > 35) return `🔥 Sto soffrendo il caldo, ${t.toFixed(1)}°C sono troppi per me.`;
        if (t < 0) return `❄️ Questo gelo mi fa male, ${t.toFixed(1)}°C sono pericolosi.`;
        
        return `🌤️ La temperatura di ${t.toFixed(1)}°C mi sta bene.`;
    }

    _analizza_qualita_aria(punteggio) {
        if (punteggio === null) return "🌬️ Non so com'è l'aria oggi.";
        if (punteggio > 80) return "🌬️ L'aria è buona oggi.";
        return "😷 L'aria non è delle migliori.";
    }

    genera_riflessione_completa() {
        const stats_sett = this._analizza_settimana();
        const stats_dec = this._analizza_decennio();

        const messaggi = [
            `• ${this._analizza_idratazione(stats_sett, stats_dec)}`,
            `• ${this._analizza_temperatura(stats_sett, stats_dec)}`,
            `• ${this._analizza_qualita_aria(stats_sett.air_quality)}`
        ];

        return `🌳 **Come sto oggi - ${this.nome}** 🌳\n\n${messaggi.join('\n')}\n\n_Con affetto, ${this.nome}_ 🌿`;
    }

    // Helper methods
    _safeMean(arr) {
        if (!arr || arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }

    _safeMax(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.max(...arr);
    }

    _safeMin(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.min(...arr);
    }

    _safeStd(arr) {
        if (!arr || arr.length === 0) return 0;
        const mean = this._safeMean(arr);
        const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
        return Math.sqrt(this._safeMean(squareDiffs));
    }

    _safeSum(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0);
    }

    _calcola_giorni_senza_pioggia() {
        return 3;
    }
}

/**
 * Funzione principale che restituisce una stringa con la riflessione dello stato dell'albero
 * basata sui dati meteorologici della posizione specificata
 */
async function weatherReflection(latitude, longitude) {
  try {
    const weatherService = new WeatherService();
    const weatherData = await weatherService.getAllWeatherData(latitude, longitude);
    
    const wiseTree = new WiseTree(
      weatherData.hourlyData,
      weatherData.dailyLastYear,
      weatherData.monthly10Years
    );

    const reflection = wiseTree.generateReflection();
    return reflection;
    //return "temp"

  } catch (error) {
    console.error('Errore nella generazione della riflessione:', error);
    return `Impossibile generare l'analisi dello stato dell'albero. Errore: ${error.message}`;
  }
}

// Esporta SOLO la funzione weatherReflection
module.exports = { weatherReflection, AlberoSaggio};