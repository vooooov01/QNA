// DOM 요소
const questionForm = document.getElementById('new-question-form');
const questionsList = document.getElementById('questions-list');

// 질문 데이터를 저장할 배열 (로컬 스토리지가 있으면 로드, 없으면 빈 배열)
let questions = JSON.parse(localStorage.getItem('questions')) || [];

// 페이지 로드 시 질문 목록 표시
document.addEventListener('DOMContentLoaded', () => {
    renderQuestions();
});

// 질문 폼 제출 이벤트 리스너
questionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 폼에서 데이터 가져오기
    const username = document.getElementById('username').value;
    const subject = document.getElementById('subject').value;
    const title = document.getElementById('question-title').value;
    const content = document.getElementById('question-content').value;
    
    // 새 질문 객체 생성
    const newQuestion = {
        id: Date.now(), // 고유 ID로 현재 타임스탬프 사용
        username,
        subject,
        title,
        content,
        date: new Date().toLocaleDateString(),
        answers: []
    };
    
    // 질문 배열에 추가
    questions.unshift(newQuestion); // 최신 질문이 맨 위에 오도록 배열 앞에 추가
    
    // 로컬 스토리지에 저장
    saveQuestions();
    
    // 질문 목록 다시 렌더링
    renderQuestions();
    
    // 폼 초기화
    questionForm.reset();
});

// 질문 목록 렌더링 함수
function renderQuestions() {
    // 질문 목록 컨테이너 비우기
    questionsList.innerHTML = '';
    
    // 질문이 없을 경우 메시지 표시
    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="no-questions">아직 질문이 없습니다. 첫 번째 질문을 등록해보세요!</p>';
        return;
    }
    
    // 각 질문에 대해 HTML 생성 및 추가
    questions.forEach(question => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.dataset.id = question.id;
        
        questionCard.innerHTML = `
            <div class="question-header">
                <div>
                    <span class="question-subject">${question.subject}</span>
                    <h3 class="question-title">${question.title}</h3>
                    <p class="question-meta">작성자: ${question.username} | 작성일: ${question.date}</p>
                </div>
            </div>
            <div class="question-content">
                ${question.content}
            </div>
            <div class="answers-container">
                <h4>답변 (${question.answers.length})</h4>
                <div class="answers-list">
                    ${renderAnswers(question.answers)}
                </div>
                <div class="answer-form">
                    <h4>답변 작성</h4>
                    <form class="new-answer-form" data-question-id="${question.id}">
                        <div class="form-group">
                            <label for="answer-username-${question.id}">작성자</label>
                            <input type="text" id="answer-username-${question.id}" required>
                        </div>
                        <div class="form-group">
                            <label for="answer-content-${question.id}">답변 내용</label>
                            <textarea id="answer-content-${question.id}" rows="3" required></textarea>
                        </div>
                        <button type="submit">답변 등록</button>
                    </form>
                </div>
            </div>
        `;
        
        questionsList.appendChild(questionCard);
        
        // 답변 폼에 이벤트 리스너 추가
        const answerForm = questionCard.querySelector('.new-answer-form');
        answerForm.addEventListener('submit', handleAnswerSubmit);
    });
}

// 답변 렌더링 함수
function renderAnswers(answers) {
    if (answers.length === 0) {
        return '<p>아직 답변이 없습니다.</p>';
    }
    
    return answers.map(answer => `
        <div class="answer-card">
            <p class="answer-meta">작성자: ${answer.username} | 작성일: ${answer.date}</p>
            <p>${answer.content}</p>
        </div>
    `).join('');
}

// 답변 제출 처리 함수
function handleAnswerSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const questionId = parseInt(form.dataset.questionId);
    const username = form.querySelector('input[id^="answer-username"]').value;
    const content = form.querySelector('textarea[id^="answer-content"]').value;
    
    // 해당 질문 찾기
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex !== -1) {
        // 새 답변 객체 생성
        const newAnswer = {
            id: Date.now(),
            username,
            content,
            date: new Date().toLocaleDateString()
        };
        
        // 질문의 답변 배열에 추가
        questions[questionIndex].answers.push(newAnswer);
        
        // 로컬 스토리지에 저장
        saveQuestions();
        
        // 질문 목록 다시 렌더링
        renderQuestions();
    }
}

// 로컬 스토리지에 질문 배열 저장
function saveQuestions() {
    localStorage.setItem('questions', JSON.stringify(questions));
}

// 삭제 기능 (옵션)
// 전체 질문 삭제 함수
function clearAllQuestions() {
    if (confirm('모든 질문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        questions = [];
        saveQuestions();
        renderQuestions();
    }
}

// 예시 데이터 추가 (개발 편의를 위한 함수)
function addSampleData() {
    if (questions.length === 0) {
        const sampleQuestions = [
            {
                id: 1000,
                username: '김학생',
                subject: '수학',
                title: '미분 방정식 풀이에 대해 질문있습니다',
                content: '2차 미분 방정식 dy/dx + y = 0의 일반해를 구하는 방법을 알려주세요.',
                date: '2023-09-15',
                answers: [
                    {
                        id: 2000,
                        username: '이선생',
                        content: '이 방정식은 특성방정식 r + 1 = 0을 풀어서 r = -1을 구한 다음, y = Ce^(-x) 형태의 해를 얻을 수 있습니다.',
                        date: '2023-09-16'
                    }
                ]
            },
            {
                id: 1001,
                username: '박학생',
                subject: '과학',
                title: '광합성 과정에 대해 궁금합니다',
                content: '식물의 광합성 과정에서 빛 에너지가 어떻게 화학 에너지로 변환되는지 설명해주실 수 있나요?',
                date: '2023-09-14',
                answers: []
            }
        ];
        
        questions = sampleQuestions;
        saveQuestions();
        renderQuestions();
    }
}

// 개발 환경에서만 샘플 데이터 추가 (실제 배포 시 제거)
// addSampleData();
