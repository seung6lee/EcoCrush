// Essential Data
let level = 1;
const max_score = 20000;
let score = max_score;
const length = 350;
const width = 6;
const w = length / width;
let elements = []; // DOM 요소 저장
// 2D 배열 생성
let data = Array.from({ length: width }, () =>
    Array.from({ length: width }, () => Math.floor(Math.random() * 5) + 1)
);

// let data = [
//     [1, 2, 1, 6, 1, 2],
//     [2, 1, 2, 1, 2, 1],
//     [5, 2, 1, 2, 6, 2],
//     [5, 6, 2, 1, 2, 1],
//     [1, 2, 1, 2, 7, 2],
//     [5, 1, 2, 1, 2, 1],
// ];

let last_d = 0;
let eer = 5;
let limit = 15;
let points = [0, 12, 21, 60, 230, 3050]; //1st index is nothing.
let sbp_points = [0, 0.1, 10, 1, 5, 7];
let ending = false;

// Variables for drag/touch
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

function build() {
    const game = document.querySelector("#game");
    // 기존 DOM 요소 삭제
    elements.forEach((element) => element.remove());
    elements = []; // 요소 배열 초기화

    // 새 DOM 요소 생성 및 추가
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < width; j++) {
            const element = document.createElement("div");
            element.className = "element";
            element.setAttribute("draggable", true);
            element.setAttribute("id", `${i},${j}`);
            element.style.width = `${w}px`;
            element.style.height = `${w}px`;
            element.style.backgroundImage = `url(images/${data[i][j]}.png)`;
            element.style.position = "absolute";
            element.style.top = `${i * w}px`;
            element.style.left = `${j * w}px`;

            // 이벤트 핸들러 추가
            addEventListeners(element);

            game.appendChild(element);
            elements.push(element); // 새 요소 추가
        }
    }
}

function addEventListeners(element) {
    // Drag 이벤트
    element.addEventListener("dragstart", dragStartHandler);
    element.addEventListener("drag", dragHandler);
    element.addEventListener("dragend", dragEndHandler);

    // Touch 이벤트
    element.addEventListener("touchstart", touchStartHandler);
    element.addEventListener("touchmove", touchMoveHandler);
    element.addEventListener("touchend", touchEndHandler);
}

// Drag Event Handlers
function dragStartHandler(e) {
    startX = e.clientX;
    startY = e.clientY;
    e.target.style.zIndex = "1024";
}

function dragHandler(e) {
    if (e.clientX === 0 && e.clientY === 0) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentX = Math.max(-w, Math.min(w, deltaX));
        currentY = 0;
    } else {
        currentY = Math.max(-w, Math.min(w, deltaY));
        currentX = 0;
    }

    e.target.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

function dragEndHandler(e) {
    handleEndEvent(e.target);
}

// Touch Event Handlers
function touchStartHandler(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    e.target.style.zIndex = "1024";
}

function touchMoveHandler(e) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        currentX = Math.max(-w, Math.min(w, deltaX));
        currentY = 0;
    } else {
        currentY = Math.max(-w, Math.min(w, deltaY));
        currentX = 0;
    }

    e.target.style.transform = `translate(${currentX}px, ${currentY}px)`;
}

function touchEndHandler(e) {
    handleEndEvent(e.target);
}

// Common End Event Handler
function handleEndEvent(element) {
    if (Math.abs(currentX) >= w * 0.7 || Math.abs(currentY) >= w * 0.7) {
        const direction =
            Math.abs(currentX) > Math.abs(currentY)
                ? currentX > 0
                    ? "right"
                    : "left"
                : currentY > 0
                ? "down"
                : "up";

        console.log("Moved:", direction);
        whenMove(element.id.split(",").map(Number), direction);

        const computedStyle = window.getComputedStyle(element);
        const currentLeft = parseInt(computedStyle.left, 10) || 0;
        const currentTop = parseInt(computedStyle.top, 10) || 0;

        element.style.left = `${currentLeft + currentX}px`;
        element.style.top = `${currentTop + currentY}px`;
        element.style.transform = "";
    } else {
        element.style.transform = "";
    }

    element.style.zIndex = "1";
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;
}

// 게임 상태를 확인하는 함수
function whenMove(coord, direction) {
    const [r, c] = coord;
    const temp = structuredClone(data);

    // 방향별 (dr, dc) 매핑
    const dirMap = {
        up: [-1, 0],
        down: [1, 0],
        left: [0, -1],
        right: [0, 1],
    };

    const [dr, dc] = dirMap[direction];

    // 바꿀 값 보관
    const currentVal = data[r][c];
    const swapVal = data[r + dr][c + dc];

    // 스왑
    temp[r][c] = swapVal;
    temp[r + dr][c + dc] = currentVal;

    // 특수 타일 체크 (6, 7)
    let special = null;
    if (currentVal === 6 || currentVal === 7) {
        special = [r + dr, c + dc];
    }
    if (swapVal === 6 || swapVal === 7) {
        special = [r, c];
    }

    // 매칭 검사
    const check = checkMatches(temp, special);
    if (check) {
        limit -= 1;
        limitChange();
    } else {
        build();
    }
}

function checkMatches(temp, special) {
    const rows = temp.length; // 행 개수
    const cols = temp[0].length; // 열 개수

    // 가로 매칭 확인
    for (let i = 0; i < rows; i++) {
        let count = 1; // 연속된 숫자 개수
        for (let j = 1; j < cols; j++) {
            if (temp[i][j] === temp[i][j - 1]) {
                count++;
                if (
                    count >= 3 &&
                    (j === cols - 1 || temp[i][j] !== temp[i][j + 1])
                ) {
                    animation(
                        {
                            type: "horizontal",
                            row: i,
                            startCol: j - count + 1,
                            endCol: j,
                            length: count,
                            special: special,
                        },
                        temp
                    );
                    return true;
                }
            } else {
                count = 1;
            }
        }
    }

    // 세로 매칭 확인
    for (let j = 0; j < cols; j++) {
        let count = 1; // 연속된 숫자 개수
        for (let i = 1; i < rows; i++) {
            if (temp[i][j] === temp[i - 1][j]) {
                count++;
                if (
                    count >= 3 &&
                    (i === rows - 1 || temp[i][j] !== temp[i + 1][j])
                ) {
                    animation(
                        {
                            type: "vertical",
                            col: j,
                            startRow: i - count + 1,
                            endRow: i,
                            length: count,
                            special: special,
                        },
                        temp
                    );
                    return true;
                }
            } else {
                count = 1;
            }
        }
    }

    return;
}

function setEer(n) {
    if (n <= 1) {
        eer = 1;
    } else {
        eer = n;
    }
    document.getElementById("eer-logo").src = `./images/eer/${eer}.png`;
    document.getElementById("eer").value = eer;
}

function change_sbp(n) {
    last_d = n;
    document.getElementById("sbp").max = Math.max.apply(null, sbp_points);
    document.getElementById("sbp-logo").src = `./images/trans/${n}.png`;
    document.getElementById("sbp").value = sbp_points[n];
}

// 특수카드
function setSbp() {
    const originalSbp = sbp; // 현재 대기전력 저장
    sbp = Math.floor(originalSbp * 0.5); // 대기전력을 50%로 설정

    // 10초 후 대기전력을 원래 값으로 복원
    setTimeout(() => {
        sbp = originalSbp; // 원래 대기전력 값 복원
        document.getElementById("sbp").innerText = `대기전력: ${sbp}`;
    }, 10000); // 10000ms = 10초
}

function animation(check, temp) {
    if (check.special) {
        const [sx, sy] = check.special;
        if (temp[sx][sy] == 6) {
            setSbp();
        } else if (temp[sx][sy] == 7) {
            setEer(eer - 1);

            // Code Here
        }
        temp[sx][sy] = Math.floor(Math.random() * 5) + 1;
    }

    data = temp;
    console.log(data);
    build();

    let moved;
    console.log(check);
    if (check.type === "vertical") {
        change_sbp(data[check.startRow][check.col]);
        score -=
            points[data[check.startRow][check.col]] *
            (1 + 0.1 * (5 - eer)) *
            check.length;
        scoreChange();
        popup(data[check.startRow][check.col], check.length);

        // 삭제
        setTimeout(() => {
            for (let i = check.startRow; i <= check.endRow; i++) {
                document.getElementById(`${i},${check.col}`).remove();
            }
        }, 0);

        // 내리기
        setTimeout(() => {
            for (let i = 0; i < check.startRow; i++) {
                moved = document.getElementById(`${i},${check.col}`);
                moved.style.top = `${(i + check.length) * w}px`;

                data[i + check.length][check.col] = data[i][check.col];
            }
        }, 100);

        // 추가하기
        setTimeout(() => {
            for (let i = 0; i < check.length; i++) {
                data[i][check.col] = Math.floor(Math.random() * 5) + 1;
            }

            if (check.length == 4) {
                data[check.startRow + 2][check.col] = 6;
            } else if (check.length == 5) {
                data[Math.floor((check.startRow + check.endRow) / 2)][
                    check.col
                ] = 7;
            }

            console.log(data);
            build();
            checkMatches(data);
        }, 600);
    } else if (check.type === "horizontal") {
        change_sbp(data[check.row][check.startCol]);
        score -=
            points[data[check.row][check.startCol]] *
            (1 + 0.1 * (5 - eer)) *
            check.length;
        scoreChange();
        popup(data[check.row][check.startCol], check.length);

        // 삭제
        setTimeout(() => {
            for (let i = check.startCol; i <= check.endCol; i++) {
                document.getElementById(`${check.row},${i}`).remove();
            }
        }, 0);

        // 내리기
        setTimeout(() => {
            for (let i = check.row - 1; i >= 0; i--) {
                for (let j = check.startCol; j <= check.endCol; j++) {
                    moved = document.getElementById(`${i},${j}`);
                    moved.style.top = `${(i + 1) * w}px`;

                    data[i + 1][j] = data[i][j];
                }
            }
        }, 100);

        // 추가하기
        setTimeout(() => {
            for (let i = check.startCol; i <= check.endCol; i++) {
                data[0][i] = Math.floor(Math.random() * 5) + 1;
            }

            if (check.length == 4) {
                data[check.row][check.startCol + 2] = 6;
            } else if (check.length == 5) {
                data[check.row][
                    Math.floor((check.startCol + check.endCol) / 2)
                ] = 7;
            }

            console.log(data);
            build();
            checkMatches(data);
        }, 600);
    }
}

function scoreChange() {
    if (score <= 0) {
        // document.getElementById("status-box").remove();
        // document.getElementById("elec-box").remove();
        // document.getElementById("limit").innerHTML =
        //     "Great job!<br>You saved energy in the classroom!😎✨";
        if (ending == false) {
            const overlay = document.createElement("div");
            overlay.className = "modal-overlay";
            document.body.appendChild(overlay);

            let card = document.createElement("div");
            card.className = "ending";

            let level_text = document.createElement("p");
            level_text.innerText = `Level ${level} Success`;

            let img = document.createElement("img");
            img.src = `images/마스코트.png`;

            let score_text = document.createElement("p");
            score_text.innerText = `You saved ${Math.floor(
                max_score * 0.4781
            )}kg of CO₂`;

            let btn = document.createElement("button");
            btn.innerText = `Next`;
            btn.addEventListener("click", function () {
                window.location.href = "./map.html"; // 이동할 페이지 URL
            });

            card.appendChild(level_text);
            card.appendChild(img);
            card.appendChild(score_text);
            card.appendChild(btn);

            document.body.appendChild(card);
            document.body.classList.add("modal-active");
            ending = true;
        }
    }

    document.getElementById("score").value = score;
}

function limitChange() {
    if (limit == 0) {
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";
        document.body.appendChild(overlay);

        let card = document.createElement("div");
        card.className = "ending";

        let level = document.createElement("p");
        level.innerText = `Level ${1} Fail`;

        let img = document.createElement("img");
        img.src = `images/마스코트.png`;

        let score_text = document.createElement("p");
        score_text.innerHTML = `Although,<br>You saved ${Math.floor(
            score * 0.4781
        )}kg of CO₂`;

        let btn = document.createElement("button");
        btn.innerText = `Try Again`;
        btn.addEventListener("click", function () {
            location.reload();
        });

        card.appendChild(level);
        card.appendChild(img);
        card.appendChild(score_text);
        card.appendChild(btn);

        document.body.appendChild(card);
        document.body.classList.add("modal-active");
        ending = true;
    }

    document.getElementById("limit").innerText = `❤️ ${limit}`;
    return;
}

function popup(type, message) {
    let card = document.createElement("div");
    card.className = "popup";

    let img = document.createElement("img");
    img.src = `images/${type}.png`;
    img.onerror = () => {
        img.src = "images/default.png";
    };

    let txt = document.createElement("p");
    txt.innerText = `${Math.floor(
        points[type] * (1 + 0.1 * (5 - eer))
    )} x ${message}W`;

    card.appendChild(img);
    card.appendChild(txt);

    document.body.appendChild(card);

    setTimeout(() => {
        card.remove();
    }, 800);
}

function updateScoreContinuously() {
    setInterval(() => {
        if (score + sbp_points[last_d] < max_score) {
            score += Math.floor(sbp_points[last_d]) * 10;
        }
        scoreChange(); // 점수 갱신
    }, 100); // 1초마다 실행
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("level")) {
        level = urlParams.get("level");
    }
    document.body.style.backgroundImage = `url("./images/gameBG/${level}.png")`

    build(); // 초기 게임판 생성
    limitChange();
    checkMatches(data);

    document.getElementById("score").max = score;
    document.getElementById("score").value = score;

    updateScoreContinuously();
});
