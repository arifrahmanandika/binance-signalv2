const BinanceService = require("./services/binance");
const TraderBot = require("./bot/trader");
const config = require("./config/config");

async function main() {
  try {
    // Initialize services
    const binanceService = new BinanceService(config.binance.apiUrl);

    // Initialize and start bot
    const bot = new TraderBot(binanceService, config);
    bot.start();

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down bot...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down bot...");
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

main();
