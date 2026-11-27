
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 웹페이지 파일 제공
app.use(express.static(__dirname));

// 공휴일 정보 API
app.get("/api/holidays", async (req, res) => {
    try {
        const { year, month } = req.query;

        if (
            !/^\d{4}$/.test(year || "") ||
            !/^(0?[1-9]|1[0-2])$/.test(month || "")
        ) {
            return res.status(400).json({
                error: "올바른 연도와 월을 입력해주세요."
            });
        }

        const serviceKey = process.env.HOLIDAY_API_KEY;

        if (!serviceKey) {
            return res.status(500).json({
                error: "API 인증키가 설정되지 않았습니다."
            });
        }

        const apiUrl = new URL(
            "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
        );

        apiUrl.searchParams.set("serviceKey", serviceKey);
        apiUrl.searchParams.set("solYear", year);
        apiUrl.searchParams.set("solMonth", month.padStart(2, "0"));
        apiUrl.searchParams.set("_type", "json");
        apiUrl.searchParams.set("numOfRows", "100");

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();
        const result = data.response;

        if (result.header.resultCode !== "00") {
            throw new Error(result.header.resultMsg);
        }

        const items = result.body.items?.item || [];

        res.json({
            year,
            month,
            holidays: Array.isArray(items) ? items : [items]
        });

    } catch (error) {
        console.error("공휴일 조회 오류:", error.message);

        res.status(500).json({
            error: "공휴일 정보를 가져오지 못했습니다."
        });
    }
});

app.listen(PORT, () => {
    console.log(`서버 실행: 포트 ${PORT}`);
});
