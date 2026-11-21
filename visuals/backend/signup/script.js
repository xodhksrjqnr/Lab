
const form = document.getElementById("signupForm");
const resetButton = document.getElementById("resetButton");

const processItems = document.querySelectorAll(".process-item");
const resultMessage = document.getElementById("resultMessage");
const resultData = document.getElementById("resultData");

// 테스트용 중복 데이터
const duplicateIds = ["admin", "test"];
const duplicateEmails = ["admin@test.com", "test@test.com"];

function resetProcess() {
    processItems.forEach(item => {
        item.classList.remove("active", "success", "error");
        item.querySelector(".status").textContent = "대기";
    });

    resultMessage.className = "result-message";
    resultMessage.textContent = "회원가입 요청을 기다리고 있습니다.";

    resultData.textContent = "아직 처리된 데이터가 없습니다.";
}

function updateStep(index, status, message) {
    const item = processItems[index];

    item.classList.remove("active", "success", "error");
    item.classList.add(status);

    item.querySelector(".status").textContent = message;
}

function showResult(message, type, data = null) {
    resultMessage.className = `result-message ${type}`;
    resultMessage.textContent = message;

    resultData.textContent = data
        ? JSON.stringify(data, null, 2)
        : "처리된 데이터가 없습니다.";
}

function validate(data) {
    if (!data.userId || !data.email || !data.password) {
        return "모든 항목을 입력해 주세요.";
    }

    if (!/^[a-zA-Z0-9_]{4,20}$/.test(data.userId)) {
        return "아이디는 영문, 숫자, 밑줄 4~20자로 입력해 주세요.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "올바른 이메일 형식이 아닙니다.";
    }

    if (data.password.length < 8) {
        return "비밀번호는 8자 이상이어야 합니다.";
    }

    return null;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runProcess(data) {
    resetProcess();

    // 1. Controller
    updateStep(0, "active", "처리 중");
    await wait(500);
    updateStep(0, "success", "완료");

    // 2. DTO Validation
    updateStep(1, "active", "검증 중");
    await wait(500);

    const validationError = validate(data);

    if (validationError) {
        updateStep(1, "error", "실패");
        showResult(validationError, "error");
        return;
    }

    updateStep(1, "success", "완료");

    // 3. Service
    updateStep(2, "active", "중복 확인 중");
    await wait(500);

    if (
        duplicateIds.includes(data.userId) ||
        duplicateEmails.includes(data.email.toLowerCase())
    ) {
        updateStep(2, "error", "중복");
        showResult("이미 사용 중인 아이디 또는 이메일입니다.", "error");
        return;
    }

    updateStep(2, "success", "완료");

    // 4. Password Encoder
    updateStep(3, "active", "암호화 중");
    await wait(500);

    // 실제 암호화가 아닌 테스트용 표시
    const encodedPassword = "[암호화된 비밀번호 예시]";

    updateStep(3, "success", "완료");

    // 5. Repository
    updateStep(4, "active", "저장 중");
    await wait(500);

    const result = {
        id: Math.floor(Math.random() * 100000),
        userId: data.userId,
        email: data.email,
        password: encodedPassword,
        createdAt: new Date().toISOString()
    };

    updateStep(4, "success", "완료");

    showResult("회원가입 처리가 성공적으로 완료되었습니다.", "success", result);
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = {
        userId: document.getElementById("userId").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
    };

    await runProcess(data);
});

resetButton.addEventListener("click", () => {
    form.reset();
    resetProcess();
});
