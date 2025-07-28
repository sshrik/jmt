// Yahoo Finance 데이터 수집 스크립트 (30년 확장버전)
import yahooFinance from "yahoo-finance2";
import fs from "fs/promises";
import path from "path";

// 한국 주요 종목들 (상장일 고려)
const KOREAN_STOCKS = [
  {
    symbol: "005930.KS",
    name: "삼성전자",
    market: "KOSPI",
    since: "1975-06-11",
  },
  {
    symbol: "000660.KS",
    name: "SK하이닉스",
    market: "KOSPI",
    since: "1996-12-26",
  },
  { symbol: "035420.KS", name: "NAVER", market: "KOSPI", since: "2002-10-29" },
  { symbol: "005380.KS", name: "현대차", market: "KOSPI", since: "1974-02-26" },
  { symbol: "051910.KS", name: "LG화학", market: "KOSPI", since: "2001-04-19" },
  { symbol: "035720.KS", name: "카카오", market: "KOSPI", since: "2017-07-10" },
  {
    symbol: "373220.KS",
    name: "LG에너지솔루션",
    market: "KOSPI",
    since: "2022-01-27",
  },
  {
    symbol: "207940.KS",
    name: "삼성바이오로직스",
    market: "KOSPI",
    since: "2016-11-10",
  },
  {
    symbol: "068270.KS",
    name: "셀트리온",
    market: "KOSPI",
    since: "2002-07-15",
  },
  {
    symbol: "006400.KS",
    name: "삼성SDI",
    market: "KOSPI",
    since: "1979-05-08",
  },
];

// 미국 주요 종목들
const US_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ", since: "1980-12-12" },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    market: "NASDAQ",
    since: "1986-03-13",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    market: "NASDAQ",
    since: "2004-08-19",
  },
  {
    symbol: "TSLA",
    name: "Tesla, Inc.",
    market: "NASDAQ",
    since: "2010-06-29",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    market: "NASDAQ",
    since: "1999-01-22",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com, Inc.",
    market: "NASDAQ",
    since: "1997-05-15",
  },
  {
    symbol: "META",
    name: "Meta Platforms, Inc.",
    market: "NASDAQ",
    since: "2012-05-18",
  },
  {
    symbol: "BRK-B",
    name: "Berkshire Hathaway Inc.",
    market: "NYSE",
    since: "1996-05-09",
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    market: "NYSE",
    since: "1970-01-01",
  },
  { symbol: "V", name: "Visa Inc.", market: "NYSE", since: "2008-03-19" },
];

// 주요 지수들
const INDICES = [
  { symbol: "^GSPC", name: "S&P 500", market: "INDEX", since: "1957-03-04" },
  {
    symbol: "^DJI",
    name: "Dow Jones Industrial Average",
    market: "INDEX",
    since: "1896-05-26",
  },
  {
    symbol: "^IXIC",
    name: "NASDAQ Composite",
    market: "INDEX",
    since: "1971-02-05",
  },
  { symbol: "^KS11", name: "KOSPI", market: "INDEX", since: "1983-01-04" },
  { symbol: "^KQ11", name: "KOSDAQ", market: "INDEX", since: "1996-07-01" },
];

// 암호화폐 (참고용)
const CRYPTO = [
  {
    symbol: "BTC-USD",
    name: "Bitcoin USD",
    market: "CRYPTO",
    since: "2014-09-17",
  },
  {
    symbol: "ETH-USD",
    name: "Ethereum USD",
    market: "CRYPTO",
    since: "2017-11-09",
  },
];

function getDataStartDate(stockSince, maxYearsBack = 30) {
  const today = new Date();
  const maxStartDate = new Date();
  maxStartDate.setFullYear(today.getFullYear() - maxYearsBack);

  const stockStartDate = new Date(stockSince);

  // 상장일과 30년 전 중 더 최근 날짜 선택
  return stockStartDate > maxStartDate ? stockStartDate : maxStartDate;
}

async function fetchStockData(symbol, name, market, since) {
  try {
    console.log(`📊 ${symbol} (${name}) 데이터 수집 중...`);

    const endDate = new Date();
    const startDate = getDataStartDate(since, 30);

    console.log(
      `   📅 수집 기간: ${startDate.toISOString().split("T")[0]} ~ ${endDate.toISOString().split("T")[0]}`
    );

    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d", // 일봉
    });

    if (!result || result.length === 0) {
      console.log(`   ⚠️  ${symbol}: 데이터가 없습니다.`);
      return null;
    }

    const prices = result.map((item) => ({
      date: item.date.toISOString().split("T")[0], // YYYY-MM-DD 형태
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      adjClose: item.adjClose,
    }));

    console.log(`   ✅ ${symbol}: ${prices.length}일 데이터 수집 완료`);

    return {
      info: {
        symbol,
        name,
        market,
        currency:
          market.includes("KS") || market === "INDEX"
            ? "KRW"
            : market === "CRYPTO"
              ? "USD"
              : market.includes("USD")
                ? "USD"
                : "KRW",
        since,
      },
      prices,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      dataSource: "yahoo",
      collectedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`❌ ${symbol} 데이터 수집 실패:`, error.message);
    return null;
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function saveStockData(stockData, dataDir) {
  if (!stockData) return;

  const filename = `${stockData.info.symbol.replace(/[\^\.]/g, "_")}.json`;
  const filepath = path.join(dataDir, filename);

  await fs.writeFile(filepath, JSON.stringify(stockData, null, 2));
  console.log(
    `💾 ${stockData.info.symbol} 데이터 저장 완료: ${filename} (${stockData.prices.length}일)`
  );
}

async function main() {
  console.log("🚀 JMT 투자 데이터 수집 시작 (최대 30년)");
  console.log("=" * 50);

  // 데이터 저장 디렉토리 생성
  const dataDir = path.join(process.cwd(), "public", "data", "stocks");
  await ensureDirectoryExists(dataDir);

  // 모든 자산 데이터 수집
  const allAssets = [
    ...KOREAN_STOCKS.map((s) => ({ ...s, category: "한국주식" })),
    ...US_STOCKS.map((s) => ({ ...s, category: "미국주식" })),
    ...INDICES.map((s) => ({ ...s, category: "지수" })),
    ...CRYPTO.map((s) => ({ ...s, category: "암호화폐" })),
  ];

  console.log(`📋 총 ${allAssets.length}개 자산 데이터 수집 시작...`);

  let successCount = 0;
  let failureCount = 0;

  for (const [index, asset] of allAssets.entries()) {
    console.log(
      `\n[${index + 1}/${allAssets.length}] ${asset.category}: ${asset.name}`
    );

    const stockData = await fetchStockData(
      asset.symbol,
      asset.name,
      asset.market,
      asset.since
    );

    if (stockData) {
      await saveStockData(stockData, dataDir);
      successCount++;
    } else {
      failureCount++;
    }

    // API 호출 제한을 위한 딜레이 (2초)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // 자산 목록 저장 (카테고리별 분류)
  const assetList = {
    categories: {
      한국주식: KOREAN_STOCKS.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency: "KRW",
        since: stock.since,
        dataFile: `${stock.symbol.replace(".", "_")}.json`,
      })),
      미국주식: US_STOCKS.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency: "USD",
        since: stock.since,
        dataFile: `${stock.symbol.replace(/[\^\.]/g, "_")}.json`,
      })),
      지수: INDICES.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency:
          stock.symbol.includes("^KS") || stock.symbol.includes("^KQ")
            ? "KRW"
            : "USD",
        since: stock.since,
        dataFile: `${stock.symbol.replace(/[\^\.]/g, "_")}.json`,
      })),
      암호화폐: CRYPTO.map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        market: stock.market,
        currency: "USD",
        since: stock.since,
        dataFile: `${stock.symbol.replace(/[\^\.]/g, "_")}.json`,
      })),
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      totalAssets: allAssets.length,
      successCount,
      failureCount,
      dataSource: "yahoo-finance2",
      maxHistoryYears: 30,
    },
  };

  const assetListPath = path.join(dataDir, "asset-list.json");
  await fs.writeFile(assetListPath, JSON.stringify(assetList, null, 2));

  console.log("\n" + "=" * 50);
  console.log("✅ 데이터 수집 완료!");
  console.log(`📊 성공: ${successCount}개, 실패: ${failureCount}개`);
  console.log(`📁 데이터 저장 위치: ${dataDir}`);
  console.log(`📋 자산 목록: ${assetListPath}`);
  console.log("\n🎯 추가된 주요 자산:");
  console.log("   • S&P 500 지수 (^GSPC)");
  console.log("   • 다우존스 지수 (^DJI)");
  console.log("   • 나스닥 지수 (^IXIC)");
  console.log("   • KOSPI 지수 (^KS11)");
  console.log("   • 최대 30년 히스토리 데이터");
}

// 스크립트 실행
main().catch(console.error);
