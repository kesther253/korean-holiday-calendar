
// Render 서버 주소
const API_BASE_URL = "https://korean-holiday-calendar.onrender.com";

// 현재 날짜
let today = new Date();

let currentYear = today.getFullYear();
let currentMonth = today.getMonth();

let selectedDate = null;

// 공휴일 데이터 저장
let holidays = [];

const calendar = document.getElementById("calendar");
const currentMonthElement = document.getElementById("current-month");

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

// 메모 데이터 불러오기
function getMemos() {
    try {
        return JSON.parse(
            localStorage.getItem("holidayMemos") || "{}"
        );
    } catch (error) {
        console.error("메모 데이터 읽기 오류:", error);
        return {};
    }
}

// 공휴일 API 요청
async function loadHolidays() {
    try {
        const apiUrl =
            `${API_BASE_URL}/api/holidays?year=${currentYear}&month=${currentMonth + 1}`;

        console.log("공휴일 API 요청 주소:", apiUrl);

        const response = await fetch(apiUrl, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `HTTP ${response.status}: ${errorText}`
            );
        }

        const data = await response.json();

        holidays = data.holidays || [];

        console.log("공휴일 데이터:", holidays);

        createCalendar();

    } catch (error) {
        console.error("공휴일 조회 오류:", error);

        holidays = [];
        createCalendar();
    }
}

// 달력 생성
function createCalendar() {
    calendar.innerHTML = "";

    currentMonthElement.textContent =
        `${currentYear}년 ${currentMonth + 1}월`;

    // 요일 표시
    weekDays.forEach((day, index) => {
        const dayElement = document.createElement("div");

        dayElement.classList.add("day-name");
        dayElement.textContent = day;

        if (index === 0) {
            dayElement.classList.add("sunday");
        }

        if (index === 6) {
            dayElement.classList.add("saturday");
        }

        calendar.appendChild(dayElement);
    });

    // 첫 번째 요일과 마지막 날짜
    const firstDay = new Date(
        currentYear, currentMonth, 1
    ).getDay();

    const lastDate = new Date(
        currentYear, currentMonth + 1, 0
    ).getDate();

    // 빈칸 생성
    for (let i = 0; i < firstDay; i++) {
        const emptyElement = document.createElement("div");
        calendar.appendChild(emptyElement);
    }

    // 메모 데이터
    const memos = getMemos();

    // 날짜 생성
    for (let date = 1; date <= lastDate; date++) {
        const dayElement = document.createElement("div");
        const dayNumber = document.createElement("div");

        dayElement.classList.add("day");
        dayNumber.classList.add("day-number");

        dayNumber.textContent = date;

        const dateDay = new Date(
            currentYear, currentMonth, date
        ).getDay();

        // 날짜 문자열 생성
        const dateKey =
            `${currentYear}${String(currentMonth + 1).padStart(2, "0")}${String(date).padStart(2, "0")}`;

        // 공휴일 찾기
        const holiday = holidays.find(item =>
            String(item.locdate) === dateKey
        );

        // 메모 존재 여부
        const hasMemo = Boolean(memos[dateKey]);

        // 일요일 및 공휴일
        if (dateDay === 0 || holiday) {
            dayNumber.classList.add("sunday");
        }

        // 토요일
        if (dateDay === 6) {
            dayNumber.classList.add("saturday");
        }

        // 공휴일 이름 표시
        if (holiday) {
            dayElement.classList.add("holiday");

            const holidayName = document.createElement("div");
            holidayName.classList.add("holiday-name");
            holidayName.textContent = holiday.dateName;

            dayElement.appendChild(holidayName);
        }

        // 메모가 있는 날짜 표시
        if (hasMemo) {
            const memoMark = document.createElement("div");

            memoMark.classList.add("memo-mark");
            memoMark.textContent = "메모 있음";

            dayElement.appendChild(memoMark);
        }

        // 오늘 날짜 표시
        if (
            currentYear === today.getFullYear() &&
            currentMonth === today.getMonth() &&
            date === today.getDate()
        ) {
            dayElement.classList.add("today");
        }

        // 선택된 날짜 표시
        if (selectedDate === dateKey) {
            dayElement.classList.add("selected");
        }

        dayElement.prepend(dayNumber);

        // 날짜 클릭
        dayElement.addEventListener("click", function () {
            selectedDate = dateKey;

            document.getElementById("selected-date").textContent =
                `${currentYear}년 ${currentMonth + 1}월 ${date}일`;

            loadMemo();
            createCalendar();
        });

        calendar.appendChild(dayElement);
    }
}

// 이전 달
document.getElementById("prev-month").addEventListener("click", function () {
    currentMonth--;

    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    loadHolidays();
});

// 다음 달
document.getElementById("next-month").addEventListener("click", function () {
    currentMonth++;

    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }

    loadHolidays();
});

// 메모 불러오기
function loadMemo() {
    const memoInput = document.getElementById("memo-input");
    const memoStatus = document.getElementById("memo-status");

    const memos = getMemos();

    memoInput.value = memos[selectedDate] || "";

    memoStatus.textContent = memos[selectedDate]
        ? "저장된 메모가 있습니다."
        : "새로운 메모를 작성할 수 있습니다.";
}

// 메모 저장
document.getElementById("save-memo").addEventListener("click", function () {
    if (!selectedDate) {
        alert("먼저 날짜를 선택해주세요.");
        return;
    }

    const memoInput = document.getElementById("memo-input");
    const memoStatus = document.getElementById("memo-status");

    const memo = memoInput.value.trim();

    if (!memo) {
        alert("메모 내용을 입력해주세요.");
        return;
    }

    const memos = getMemos();

    memos[selectedDate] = memo;

    localStorage.setItem(
        "holidayMemos",
        JSON.stringify(memos)
    );

    memoStatus.textContent = "메모가 저장되었습니다.";

    createCalendar();

    alert("메모가 저장되었습니다.");
});

// 메모 삭제
document.getElementById("delete-memo").addEventListener("click", function () {
    if (!selectedDate) {
        alert("먼저 날짜를 선택해주세요.");
        return;
    }

    const memos = getMemos();

    delete memos[selectedDate];

    localStorage.setItem(
        "holidayMemos",
        JSON.stringify(memos)
    );

    document.getElementById("memo-input").value = "";

    document.getElementById("memo-status").textContent =
        "메모가 삭제되었습니다.";

    createCalendar();
});

// 처음 실행
loadHolidays();
