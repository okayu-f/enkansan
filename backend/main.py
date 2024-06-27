from fastapi import FastAPI
from fastapi.responses import JSONResponse
import yfinance as yf

app = FastAPI()


def get_stock_data(ticker):
    stock = yf.Ticker(ticker)
    hist = stock.history(start="2020-01-01")

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

    return {
        "ticker": ticker,
        "histories": data
    }


def get_exchange_rate(date):
    # この関数は簡略化のため、固定のレートを返します
    # 実際のアプリケーションでは、為替レートAPIを使用するべきです
    return 108.76  # 2020年の平均レート


@app.get("/stock-data")
async def stock_data():
    tickers = ['SPYD', 'HDV']
    result = {}
    for ticker in tickers:
        result[ticker.lower()] = get_stock_data(ticker)

    return JSONResponse(content=result)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
