class TechnicalIndicators {
  // Bollinger Bands Calculation - Manual Only
  static calculateBB(prices, period = 20, multiplier = 2) {
    try {
      // Validasi input
      if (!Array.isArray(prices) || prices.length < period) {
        console.warn(
          "Invalid prices array or insufficient data for BB calculation"
        );
        return null;
      }

      // Filter nilai yang valid (bukan NaN, null, undefined)
      const validPrices = prices.filter(
        (price) => typeof price === "number" && !isNaN(price) && isFinite(price)
      );

      if (validPrices.length < period) {
        console.warn("Insufficient valid price data for BB calculation");
        return null;
      }

      const recentPrices = validPrices.slice(-period);
      const sum = recentPrices.reduce((a, b) => a + b, 0);
      const mean = sum / period;

      const squareDiffs = recentPrices.map((price) => {
        const diff = price - mean;
        return diff * diff;
      });

      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / period;
      const stdDev = Math.sqrt(avgSquareDiff);

      const upper = mean + multiplier * stdDev;
      const lower = mean - multiplier * stdDev;
      const currentPrice = validPrices[validPrices.length - 1];

      return {
        upper: upper,
        middle: mean,
        lower: lower,
        currentPrice: currentPrice,
      };
    } catch (error) {
      console.error("Manual BB calculation error:", error.message);
      return null;
    }
  }

  // RSI Calculation - Manual Only
  static calculateRSI(prices, period = 14) {
    try {
      // Validasi input
      if (!Array.isArray(prices) || prices.length < period + 1) {
        console.warn(
          "Invalid prices array or insufficient data for RSI calculation"
        );
        return null;
      }

      // Filter nilai yang valid
      const validPrices = prices.filter(
        (price) => typeof price === "number" && !isNaN(price) && isFinite(price)
      );

      if (validPrices.length < period + 1) {
        console.warn("Insufficient valid price data for RSI calculation");
        return null;
      }

      let gains = 0;
      let losses = 0;

      // Calculate initial gains and losses
      for (let i = 1; i <= period; i++) {
        const change = validPrices[i] - validPrices[i - 1];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;

      // Calculate RSI for the most recent price
      const currentChange =
        validPrices[validPrices.length - 1] -
        validPrices[validPrices.length - 2];
      const currentGain = currentChange > 0 ? currentChange : 0;
      const currentLoss = currentChange < 0 ? -currentChange : 0;

      avgGain = (avgGain * (period - 1) + currentGain) / period;
      avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

      if (avgLoss === 0) return 100;

      const rs = avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      return rsi;
    } catch (error) {
      console.error("Manual RSI calculation error:", error.message);
      return null;
    }
  }

  // EMA Calculation - Manual Only
  static calculateEMA(prices, period) {
    try {
      // Validasi input
      if (!Array.isArray(prices) || prices.length < period) {
        console.warn(
          "Invalid prices array or insufficient data for EMA calculation"
        );
        return null;
      }

      // Filter nilai yang valid
      const validPrices = prices.filter(
        (price) => typeof price === "number" && !isNaN(price) && isFinite(price)
      );

      if (validPrices.length < period) {
        console.warn("Insufficient valid price data for EMA calculation");
        return null;
      }

      const multiplier = 2 / (period + 1);

      // First EMA is simple moving average
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += validPrices[i];
      }
      let ema = sum / period;

      // Calculate EMA for remaining values
      for (let i = period; i < validPrices.length; i++) {
        ema = validPrices[i] * multiplier + ema * (1 - multiplier);
      }

      return ema;
    } catch (error) {
      console.error("Manual EMA calculation error:", error.message);
      return null;
    }
  }

  // Volume Analysis
  static analyzeVolume(volumes, period = 20, multiplier = 1.5) {
    try {
      // Validasi input
      if (!Array.isArray(volumes) || volumes.length < period) {
        console.warn(
          "Invalid volumes array or insufficient data for volume analysis"
        );
        return null;
      }

      // Filter nilai yang valid
      const validVolumes = volumes.filter(
        (volume) =>
          typeof volume === "number" &&
          !isNaN(volume) &&
          isFinite(volume) &&
          volume >= 0
      );

      if (validVolumes.length < period) {
        console.warn("Insufficient valid volume data for analysis");
        return null;
      }

      const recentVolumes = validVolumes.slice(-period);
      const avgVolume =
        recentVolumes.reduce((sum, vol) => sum + vol, 0) / period;
      const currentVolume = validVolumes[validVolumes.length - 1];

      return {
        average: avgVolume,
        current: currentVolume,
        isHigh: currentVolume > avgVolume * multiplier,
      };
    } catch (error) {
      console.error("Volume analysis error:", error.message);
      return null;
    }
  }

  // Generate Trading Signal
  static generateSignal(data) {
    const { price, bb, rsi, volume, emaShort, emaLong } = data;
    let signals = [];
    let trend = "SIDEWAYS ➡➡➡";

    // Validasi price
    if (typeof price !== "number" || isNaN(price) || !isFinite(price)) {
      console.warn("Invalid price data for signal generation");
      return { signals: [], trend };
    }

    // Trend Analysis
    if (
      typeof emaShort === "number" &&
      typeof emaLong === "number" &&
      !isNaN(emaShort) &&
      !isNaN(emaLong) &&
      isFinite(emaShort) &&
      isFinite(emaLong)
    ) {
      if (emaShort > emaLong) trend = "UPTREND ⬆⬆⬆";
      else if (emaShort < emaLong) trend = "DOWNTREND ⬇⬇⬇";
    }

    // Bollinger Bands Signal
    if (
      bb &&
      typeof bb.lower === "number" &&
      typeof bb.upper === "number" &&
      !isNaN(bb.lower) &&
      !isNaN(bb.upper) &&
      isFinite(bb.lower) &&
      isFinite(bb.upper)
    ) {
      if (price <= bb.lower) {
        if (rsi && rsi < 30) {
          signals.push({
            type: "BUY 🟩",
            reason: "Price touched Lower BB + RSI Oversold",
            strength: "STRONG 🟢🟢",
          });
        } else {
          signals.push({
            type: "BUY 🟩",
            reason: "Price touched Lower BB",
            strength: "MEDIUM 🟡",
          });
        }
      } else if (price >= bb.upper) {
        if (rsi && rsi > 70) {
          signals.push({
            type: "SELL 🟥",
            reason: "Price touched Upper BB + RSI Overbought",
            strength: "STRONG 🔴🔴",
          });
        } else {
          signals.push({
            type: "SELL 🟥",
            reason: "Price touched Upper BB",
            strength: "MEDIUM 🟠",
          });
        }
      }
    }

    // RSI Confirmation
    if (typeof rsi === "number" && !isNaN(rsi) && isFinite(rsi)) {
      if (rsi < 30 && (!bb || price > bb.lower)) {
        signals.push({
          type: "BUY 🟩",
          reason: "RSI Oversold",
          strength: "MEDIUM 🟡",
        });
      } else if (rsi > 70 && (!bb || price < bb.upper)) {
        signals.push({
          type: "SELL 🟥",
          reason: "RSI Overbought",
          strength: "MEDIUM 🟠",
        });
      }
    }

    // Volume Confirmation
    if (
      volume &&
      typeof volume.current === "number" &&
      typeof volume.average === "number" &&
      !isNaN(volume.current) &&
      !isNaN(volume.average) &&
      isFinite(volume.current) &&
      isFinite(volume.average) &&
      volume.average > 0
    ) {
      if (volume.isHigh) {
        signals.push({
          type: "VOLUME_ALERT 📊",
          reason: `📊 High Volume (${(volume.current / volume.average).toFixed(
            2
          )}x average)`,
          strength: "MEDIUM",
        });
      }
    }

    return {
      signals,
      trend,
    };
  }
}

module.exports = TechnicalIndicators;
