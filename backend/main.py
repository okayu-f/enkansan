from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import yfinance as yf
from functools import lru_cache, wraps
from datetime import datetime, timedelta
import typing
import logging

# カスタムロガーの設定
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

app = FastAPI()

# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def log_api_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.info("API call to %s with args: %s, kwargs: %s", func.__name__, args, kwargs)
        return func(*args, **kwargs)
    return wrapper


@lru_cache(maxsize=32)
@log_api_call
def get_cached_stock_data(ticker, date_str):
    stock = yf.Ticker(ticker)
    end_date = datetime.strptime(date_str, '%Y-%m-%d')
    start_date = end_date - timedelta(days=365)  # 1年分のデータを取得

    # 株価データを取得
    hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=date_str)

    # 為替レートデータを一度に取得
    fx = yf.Ticker("USDJPY=X")
    fx_hist = fx.history(start=start_date.strftime('%Y-%m-%d'), end=date_str)

    data = []
    for index, row in hist.iterrows():
        date = typing.cast(datetime, index)
        # 最も近い日付の為替レートを使用
        closest_fx_date = min(fx_hist.index, key=lambda x: abs(x - date))
        exchange_rate: float = fx_hist.at[closest_fx_date, 'Close']

        dollar_price = row['Close']
        yen_price = dollar_price * exchange_rate
        data.append({
            "date": date.strftime('%Y/%m/%d'),
            "dollar": round(dollar_price, 2),
            "yen": round(yen_price),
            "exchange_rate": round(exchange_rate, 2)
        })

    return data


@app.get("/stock-data")
async def stock_data():
    tickers = ['SPYD', 'HDV']
    result = {}
    today = datetime.now().strftime('%Y-%m-%d')
    for ticker in tickers:
        result[ticker.lower()] = {
            "ticker": ticker,
            "histories": get_cached_stock_data(ticker, today)
        }

    return JSONResponse(content=result)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
