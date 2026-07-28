import asyncio
import logging
from datetime import datetime
from typing import Optional

import yfinance as yf
from fastapi import HTTPException, status

from app.schemas.market_data import (
    CompanyInformationResponse,
    LiveMarketQuoteResponse,
    MarketStatisticsResponse,
    MarketSummaryResponse,
)
from app.services.providers.base import BaseMarketDataProvider

logger = logging.getLogger(__name__)


class YahooFinanceProvider(BaseMarketDataProvider):
    """
    Implementation of the BaseMarketDataProvider using the yfinance library.
    """

    @property
    def provider_name(self) -> str:
        return "YahooFinance"

    async def _fetch_ticker_info(self, symbol: str) -> dict:
        """
        Helper method to run yfinance blocking calls in an executor.
        """
        loop = asyncio.get_running_loop()
        try:
            ticker = yf.Ticker(symbol)
            info = await loop.run_in_executor(None, lambda: ticker.info)
            if not info or "symbol" not in info or info.get("symbol") != symbol.upper():
                # yfinance returns generic info or empty dict if invalid
                # Sometimes it returns info for similar symbol. We strictly check.
                if not info or ("shortName" not in info and "regularMarketPrice" not in info and "currentPrice" not in info):
                     raise HTTPException(
                         status_code=status.HTTP_404_NOT_FOUND,
                         detail=f"Symbol {symbol} not found or no data available."
                     )
            return info
        except HTTPException:
            raise
        except Exception as e:
            error_msg = str(e)
            logger.error("Error fetching data from Yahoo Finance for %s: %s", symbol, error_msg)
            
            if "429" in error_msg or "Too Many Requests" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Market data provider rate limit exceeded: {error_msg}"
                )
                
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error communicating with market data provider: {error_msg}"
            )

    async def get_live_quote(self, symbol: str) -> LiveMarketQuoteResponse:
        info = await self._fetch_ticker_info(symbol)

        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        if price is None:
             raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail=f"Live quote not available for {symbol}."
             )

        return LiveMarketQuoteResponse(
            symbol=symbol.upper(),
            price=price,
            open=info.get("open") or info.get("regularMarketOpen"),
            high=info.get("dayHigh") or info.get("regularMarketDayHigh"),
            low=info.get("dayLow") or info.get("regularMarketDayLow"),
            previous_close=info.get("previousClose") or info.get("regularMarketPreviousClose"),
            volume=info.get("volume") or info.get("regularMarketVolume"),
            timestamp=datetime.utcnow(),
            provider=self.provider_name
        )

    async def get_company_info(self, symbol: str) -> CompanyInformationResponse:
        info = await self._fetch_ticker_info(symbol)

        return CompanyInformationResponse(
            symbol=symbol.upper(),
            company_name=info.get("longName") or info.get("shortName"),
            exchange=info.get("exchange"),
            currency=info.get("currency") or info.get("financialCurrency"),
            sector=info.get("sector"),
            industry=info.get("industry"),
            country=info.get("country"),
            provider=self.provider_name
        )

    async def get_market_statistics(self, symbol: str) -> MarketStatisticsResponse:
        info = await self._fetch_ticker_info(symbol)

        return MarketStatisticsResponse(
            symbol=symbol.upper(),
            market_cap=info.get("marketCap"),
            average_volume=info.get("averageVolume"),
            pe_ratio=info.get("trailingPE"),
            dividend_yield=info.get("dividendYield"),
            beta=info.get("beta"),
            fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
            fifty_two_week_low=info.get("fiftyTwoWeekLow"),
            provider=self.provider_name
        )

    async def get_market_summary(self, symbol: str) -> MarketSummaryResponse:
        info = await self._fetch_ticker_info(symbol)
        
        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        if price is None:
             raise HTTPException(
                 status_code=status.HTTP_404_NOT_FOUND,
                 detail=f"Live data not available for {symbol}."
             )

        quote = LiveMarketQuoteResponse(
            symbol=symbol.upper(),
            price=price,
            open=info.get("open") or info.get("regularMarketOpen"),
            high=info.get("dayHigh") or info.get("regularMarketDayHigh"),
            low=info.get("dayLow") or info.get("regularMarketDayLow"),
            previous_close=info.get("previousClose") or info.get("regularMarketPreviousClose"),
            volume=info.get("volume") or info.get("regularMarketVolume"),
            timestamp=datetime.utcnow(),
            provider=self.provider_name
        )

        company = CompanyInformationResponse(
            symbol=symbol.upper(),
            company_name=info.get("longName") or info.get("shortName"),
            exchange=info.get("exchange"),
            currency=info.get("currency") or info.get("financialCurrency"),
            sector=info.get("sector"),
            industry=info.get("industry"),
            country=info.get("country"),
            provider=self.provider_name
        )

        stats = MarketStatisticsResponse(
            symbol=symbol.upper(),
            market_cap=info.get("marketCap"),
            average_volume=info.get("averageVolume"),
            pe_ratio=info.get("trailingPE"),
            dividend_yield=info.get("dividendYield"),
            beta=info.get("beta"),
            fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
            fifty_two_week_low=info.get("fiftyTwoWeekLow"),
            provider=self.provider_name
        )

        return MarketSummaryResponse(
            quote=quote,
            company_info=company,
            statistics=stats
        )
