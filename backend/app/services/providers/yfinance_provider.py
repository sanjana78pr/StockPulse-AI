import asyncio
import logging
import os
import sys
from datetime import datetime
from typing import Optional
import httpx

# Fix Windows Unicode path issues BEFORE importing yfinance
# This must be done at module level before any HTTP libraries are imported
if sys.platform == "win32":
    # Set UTF-8 mode for Python on Windows
    os.environ['PYTHONUTF8'] = '1'
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    
    # Reconfigure stdout and stderr to use UTF-8
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    
    # Fix SSL certificate path issue on Windows with Unicode paths
    # Copy certifi bundle to a safe ASCII path if needed
    try:
        import certifi
        import shutil
        import tempfile
        
        original_bundle = certifi.where()
        
        # Check if path contains non-ASCII characters
        try:
            original_bundle.encode('ascii')
        except UnicodeEncodeError:
            # Path contains Unicode, need to create ASCII copy
            safe_bundle_path = os.path.join(tempfile.gettempdir(), 'cacert.pem')
            if not os.path.exists(safe_bundle_path) or os.path.getmtime(original_bundle) > os.path.getmtime(safe_bundle_path):
                shutil.copy2(original_bundle, safe_bundle_path)
            
            # Override the bundle location
            os.environ['CURL_CA_BUNDLE'] = safe_bundle_path
            os.environ['REQUESTS_CA_BUNDLE'] = safe_bundle_path
            os.environ['SSL_CERT_FILE'] = safe_bundle_path
            
    except Exception as e:
        logging.getLogger(__name__).warning("Could not set up safe SSL bundle path: %s", e)

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
    Handles Windows Unicode path issues that can cause UnicodeEncodeError.
    """

    @property
    def provider_name(self) -> str:
        return "YahooFinance"

    async def _fetch_ticker_info(self, symbol: str) -> dict:
        """
        Helper method to run yfinance blocking calls in an executor.
        Now properly handles Windows Unicode path issues.
        """
        loop = asyncio.get_running_loop()
        
        def _safe_yfinance_call():
            """Execute yfinance call with proper error handling."""
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                
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
                # Log the actual error for debugging but don't hide it
                logger.error("yfinance error for %s: %s", symbol, str(e))
                raise e

        try:
            info = await loop.run_in_executor(None, _safe_yfinance_call)
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

    async def search_companies(self, query: str) -> list[dict]:
        """Search Yahoo Finance for matching companies."""
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        params = {"q": query, "quotesCount": 10, "newsCount": 0}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, headers=headers, timeout=5.0)
                if response.status_code != 200:
                    logger.error("Yahoo search API returned status %s: %s", response.status_code, response.text)
                    return []
                
                data = response.json()
                results = []
                for q in data.get("quotes", []):
                    symbol = q.get("symbol")
                    company_name = q.get("longname") or q.get("shortname") or q.get("dispName") or symbol
                    exchange = q.get("exchDisp") or q.get("exchange")
                    country = q.get("country")
                    if symbol and company_name:
                        results.append({
                            "symbol": symbol.upper(),
                            "company_name": company_name,
                            "exchange": exchange,
                            "country": country,
                            "quote_type": q.get("quoteType")
                        })
                return results
            except Exception as e:
                logger.error("Error searching companies on Yahoo Finance: %s", str(e))
                return []
