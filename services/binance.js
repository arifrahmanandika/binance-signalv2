const axios = require("axios");

class BinanceService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    // Tambahkan timeout dan konfigurasi axios
    this.axiosInstance = axios.create({
      timeout: 10000, // 10 detik timeout
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
  }

  async getKlines(symbol, interval, limit = 200) {
    try {
      const response = await this.axiosInstance.get(`${this.apiUrl}/klines`, {
        params: {
          symbol: symbol,
          interval: interval,
          limit: limit,
        },
        // Tambahkan retry mechanism
        retry: 3,
        retryDelay: 1000,
      });

      return response.data.map((kline) => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteVolume: parseFloat(kline[7]),
        trades: kline[8],
        takerBuyBaseVolume: parseFloat(kline[9]),
        takerBuyQuoteVolume: parseFloat(kline[10]),
      }));
    } catch (error) {
      console.error(`Error fetching klines for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Tambahkan fungsi dengan retry mechanism
  async getKlinesWithRetry(symbol, interval, limit = 200, maxRetries = 3) {
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.getKlines(symbol, interval, limit);
      } catch (error) {
        lastError = error;

        // Jika ini adalah percobaan terakhir, throw error
        if (i === maxRetries) {
          throw lastError;
        }

        // Tunggu sebelum retry
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(
          `Retrying ${symbol} in ${delay}ms... (attempt ${i + 1}/${
            maxRetries + 1
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async getMultipleKlines(symbols, interval, limit = 200) {
    const promises = symbols.map((symbol) =>
      this.getKlinesWithRetry(symbol, interval, limit).catch((error) => {
        console.error(`Failed to fetch data for ${symbol}:`, error.message);
        return null;
      })
    );

    const results = await Promise.allSettled(promises);

    return symbols.reduce((acc, symbol, index) => {
      if (results[index].status === "fulfilled" && results[index].value) {
        acc[symbol] = results[index].value;
      } else if (results[index].status === "rejected") {
        console.error(`Rejected promise for ${symbol}:`, results[index].reason);
      }
      return acc;
    }, {});
  }
}

module.exports = BinanceService;
