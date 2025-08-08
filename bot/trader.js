const TechnicalIndicators = require("../utils/indicators");
const TelegramNotifier = require("../utils/telegram");

class TraderBot {
  constructor(binanceService, config) {
    this.binance = binanceService;
    this.config = config;
    this.telegram = new TelegramNotifier(
      config.telegram.token,
      config.telegram.chatId
    );
    this.lastSignals = new Map();
    this.errorCount = 0;
    this.maxErrorCount = 5; // Batas error berturut-turut
  }

  async analyzeSymbol(symbol, klines) {
    try {
      // Extract price and volume data dengan validasi
      if (!Array.isArray(klines) || klines.length === 0) {
        console.warn(`No kline data for ${symbol}`);
        return null;
      }

      const closes = klines
        .map((k) => k.close)
        .filter(
          (price) =>
            typeof price === "number" && !isNaN(price) && isFinite(price)
        );

      const volumes = klines
        .map((k) => k.volume)
        .filter(
          (volume) =>
            typeof volume === "number" &&
            !isNaN(volume) &&
            isFinite(volume) &&
            volume >= 0
        );

      // Validasi data
      const requiredData = Math.max(
        this.config.indicators.bb.period,
        this.config.indicators.rsi.period,
        this.config.indicators.ema.long
      );

      if (closes.length < requiredData || volumes.length < requiredData) {
        console.warn(
          `Insufficient valid data for ${symbol}: closes=${closes.length}, volumes=${volumes.length}, required=${requiredData}`
        );
        return null;
      }

      // Calculate indicators dengan error handling
      let bb = null,
        rsi = null,
        volumeAnalysis = null,
        emaShort = null,
        emaLong = null;

      try {
        bb = TechnicalIndicators.calculateBB(
          closes,
          this.config.indicators.bb.period,
          this.config.indicators.bb.multiplier
        );
      } catch (error) {
        console.warn(`BB calculation failed for ${symbol}:`, error.message);
      }

      try {
        rsi = TechnicalIndicators.calculateRSI(
          closes,
          this.config.indicators.rsi.period
        );
      } catch (error) {
        console.warn(`RSI calculation failed for ${symbol}:`, error.message);
      }

      try {
        volumeAnalysis = TechnicalIndicators.analyzeVolume(
          volumes,
          this.config.indicators.volume.period,
          this.config.indicators.volume.multiplier
        );
      } catch (error) {
        console.warn(`Volume analysis failed for ${symbol}:`, error.message);
      }

      try {
        emaShort = TechnicalIndicators.calculateEMA(
          closes,
          this.config.indicators.ema.short
        );
      } catch (error) {
        console.warn(
          `EMA Short calculation failed for ${symbol}:`,
          error.message
        );
      }

      try {
        emaLong = TechnicalIndicators.calculateEMA(
          closes,
          this.config.indicators.ema.long
        );
      } catch (error) {
        console.warn(
          `EMA Long calculation failed for ${symbol}:`,
          error.message
        );
      }

      const currentPrice = closes[closes.length - 1];

      // Generate signal
      const signalData = TechnicalIndicators.generateSignal({
        price: currentPrice,
        bb,
        rsi,
        volume: volumeAnalysis,
        emaShort,
        emaLong,
      });

      return signalData;
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error.message);
      return null;
    }
  }

  async checkSignals() {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Checking trading signals...`);

    try {
      const klinesData = await this.binance.getMultipleKlines(
        this.config.trading.symbols,
        this.config.trading.timeframe
      );

      // Cek apakah ada data yang berhasil diambil
      const successfulSymbols = Object.keys(klinesData).filter(
        (symbol) => klinesData[symbol]
      );
      console.log(
        `Successfully fetched data for ${successfulSymbols.length}/${this.config.trading.symbols.length} symbols`
      );

      if (successfulSymbols.length === 0) {
        this.errorCount++;
        console.warn(
          `No data fetched. Error count: ${this.errorCount}/${this.maxErrorCount}`
        );

        if (this.errorCount >= this.maxErrorCount) {
          const errorMessage = `[${new Date().toISOString()}] ⚠️ Critical: Failed to fetch data from Binance for ${
            this.maxErrorCount
          } consecutive attempts`;
          console.error(errorMessage);
          // Kirim notifikasi error ke Telegram
          await this.telegram.sendMessage(errorMessage);
          this.errorCount = 0; // Reset counter
        }
        return;
      }

      this.errorCount = 0; // Reset error counter jika berhasil

      for (const [symbol, klines] of Object.entries(klinesData)) {
        if (!klines || klines.length === 0) continue;

        const signalData = await this.analyzeSymbol(symbol, klines);

        if (signalData && signalData.signals.length > 0) {
          const signalKey = `${symbol}_${JSON.stringify(
            signalData.signals.map((s) => s.type)
          )}`;
          const lastSignalTime = this.lastSignals.get(signalKey) || 0;
          const currentTime = Date.now();

          // Only send signal if it's been more than 15 minutes since last similar signal
          if (currentTime - lastSignalTime > 15 * 60 * 1000) {
            const message = this.telegram.formatSignalMessage(
              symbol,
              signalData
            );
            if (message) {
              await this.telegram.sendMessage(message);
              this.lastSignals.set(signalKey, currentTime);
              console.log(`✅ Signal sent for ${symbol}`);
            }
          }
        }
      }
    } catch (error) {
      this.errorCount++;
      console.error("❌ Error checking signals:", error.message);

      // Jika error berturut-turut, kirim notifikasi
      if (this.errorCount >= this.maxErrorCount) {
        const errorMessage = `[${new Date().toISOString()}] ⚠️ Critical: Multiple errors occurred while checking signals`;
        await this.telegram.sendMessage(errorMessage);
        this.errorCount = 0;
      }
    }
  }

  start() {
    console.log("🚀 Starting Trading Bot...");
    console.log(
      `Monitoring symbols: ${this.config.trading.symbols.join(", ")}`
    );
    console.log(`Timeframe: ${this.config.trading.timeframe}`);
    console.log(
      `Interval: ${this.config.trading.interval / 1000 / 60} minutes`
    );

    // Run immediately
    this.checkSignals();

    // Schedule regular checks
    setInterval(() => {
      this.checkSignals();
    }, this.config.trading.interval);
  }
}

module.exports = TraderBot;
