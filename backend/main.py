from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import yfinance as yf
from functools import lru_cache
from datetime import datetime

app = FastAPI()


# CORSミドルウェアを追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80"],  # フロントエンドのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)


@lru_cache(maxsize=32)
def get_cached_stock_data(ticker, date_str):
    stock = yf.Ticker(ticker)
    hist = stock.history(start="2020-01-01", end=date_str)

    data = []
    for date, row in hist.iterrows():
        jst_date = date.tz_convert('Asia/Tokyo')
        dollar_price = row['Close']
        yen_price = dollar_price * get_exchange_rate(date)
        data.append({
            "date": jst_date.strftime('%Y/%m/%d'),
            "dollar": round(dollar_price, 2),
            "yen": round(yen_price)
        })

    return data


def get_exchange_rate(date):
    # この関数は簡略化のため、固定のレートを返します
    # 実際のアプリケーションでは、為替レートAPIを使用するべきです
    return 108.76  # 2020年の平均レート


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
