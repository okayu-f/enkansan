from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import yfinance as yf
from functools import lru_cache
from datetime import datetime, timedelta

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
    end_date = datetime.strptime(date_str, '%Y-%m-%d')
    start_date = end_date - timedelta(days=365)  # 1年分のデータを取得

    # 株価データを取得
    hist = stock.history(start=start_date.strftime('%Y-%m-%d'), end=date_str)

    # 為替レートデータを一度に取得
    fx = yf.Ticker("USDJPY=X")
    fx_hist = fx.history(start=start_date.strftime('%Y-%m-%d'), end=date_str)

    data = []
    for date, row in hist.iterrows():
        # 最も近い日付の為替レートを使用
        closest_fx_date = min(fx_hist.index, key=lambda x: abs(x - date))
        exchange_rate = fx_hist.loc[closest_fx_date, 'Close']

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
