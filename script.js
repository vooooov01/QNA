// DOM 요소
const questionForm = document.getElementById('new-question-form');
const questionsList = document.getElementById('questions-list');

// 질문 데이터를 저장할 배열
let questions = [];

// 페이지 로드 시 질문 목록 표시
document.addEventListener('DOMContentLoaded', () => {
    // Firebase 초기화 로그 이벤트
    analytics.logEvent('app_initialized');
    
    // Firestore에서 질문 목록 불러오기
    loadQuestionsFromFirestore();
});

// Firestore에서 질문 데이터 불러오기
function loadQuestionsFromFirestore() {
    // 로딩 메시지 표시
    questionsList.innerHTML = '<p class="loading">데이터를 불러오는 중입니다...</p>';
    
    // Firestore에서 질문 컬렉션 가져오기 (최신순 정렬)
    db.collection('questions')
        .orderBy('timestamp', 'desc')
        .get()
        .then((snapshot) => {
            questions = [];
            
            snapshot.forEach((doc) => {
                // Firestore 문서에서 질문 데이터 추출
                const question = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // 날짜 형식 변환 (Firestore Timestamp -> 문자열)
                if (question.timestamp) {
                    const date = question.timestamp.toDate();
                    question.date = date.toLocaleDateString();
                }
                
                // 질문 배열에 추가
                questions.push(question);
            });
            
            // 질문 목록 렌더링
            renderQuestions();
            
            // 데이터 로드 완료 이벤트
            analytics.logEvent('questions_loaded', { 
                question_count: questions.length 
            });
        })
        .catch((error) => {
            console.error('Firestore에서 데이터를 가져오는 중 오류 발생:', error);
            questionsList.innerHTML = '<p class="error">데이터를 불러오는 중 오류가 발생했습니다.</p>';
            
            // 오류 이벤트 로깅
            analytics.logEvent('data_load_error', { 
                error_message: error.message 
            });
        });
}

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
        username,
        subject,
        title,
        content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(), // 서버 타임스탬프 사용
        answers: []
    };
    
    // 질문 추가 버튼 비활성화 (중복 제출 방지)
    const submitBtn = questionForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    
    // Firestore에 질문 추가
    db.collection('questions')
        .add(newQuestion)
        .then((docRef) => {
            console.log('질문이 성공적으로 추가되었습니다. 문서 ID:', docRef.id);
            
            // 폼 초기화
            questionForm.reset();
            
            // 질문 목록 새로고침
            loadQuestionsFromFirestore();
            
            // 이벤트 로깅
            analytics.logEvent('question_created', {
                subject: subject,
                has_content: content.length > 0
            });
        })
        .catch((error) => {
            console.error('질문 추가 중 오류 발생:', error);
            alert('질문 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
            
            // 오류 이벤트 로깅
            analytics.logEvent('question_create_error', { 
                error_message: error.message 
            });
        })
        .finally(() => {
            // 버튼 상태 복원
            submitBtn.disabled = false;
            submitBtn.textContent = '질문 등록';
        });
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
                    <p class="question-meta">작성자: ${question.username} | 작성일: ${question.date || '날짜 정보 없음'}</p>
                </div>
            </div>
            <div class="question-content">
                ${question.content}
            </div>
            <div class="answers-container">
                <h4>답변 (<span class="answers-count">${question.answers?.length || 0}</span>)</h4>
                <div class="answers-list" id="answers-list-${question.id}">
                    ${renderAnswers(question.answers || [])}
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
    if (!answers || answers.length === 0) {
        return '<p>아직 답변이 없습니다.</p>';
    }
    
    return answers.map(answer => `
        <div class="answer-card" data-id="${answer.id}">
            <p class="answer-meta">작성자: ${answer.username} | 작성일: ${answer.date || '날짜 정보 없음'}</p>
            <p>${answer.content}</p>
        </div>
    `).join('');
}

// 답변 제출 처리 함수
function handleAnswerSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const questionId = form.dataset.questionId;
    const username = form.querySelector('input[id^="answer-username"]').value;
    const content = form.querySelector('textarea[id^="answer-content"]').value;
    
    // 답변 버튼 비활성화 (중복 제출 방지)
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    
    // 새 답변 객체 생성
    const newAnswer = {
        username,
        content,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Firestore 문서 참조 가져오기
    const questionRef = db.collection('questions').doc(questionId);
    
    // 트랜잭션으로 답변 추가 (경쟁 상태 방지)
    db.runTransaction((transaction) => {
        return transaction.get(questionRef).then((questionDoc) => {
            if (!questionDoc.exists) {
                throw new Error('질문을 찾을 수 없습니다.');
            }
            
            // 기존 답변 배열 가져오기
            const questionData = questionDoc.data();
            const answers = questionData.answers || [];
            
            // 새 답변에 ID 추가
            newAnswer.id = Date.now().toString();
            
            // 날짜 속성 추가 (서버 타임스탬프는 나중에 설정됨)
            newAnswer.date = new Date().toLocaleDateString();
            
            // 답변 배열에 새 답변 추가
            answers.push(newAnswer);
            
            // 문서 업데이트
            transaction.update(questionRef, { answers: answers });
        });
    })
    .then(() => {
        console.log('답변이 성공적으로 추가되었습니다.');
        
        // 폼 초기화
        form.reset();
        
        // 질문 목록 새로고침
        loadQuestionsFromFirestore();
        
        // 이벤트 로깅
        analytics.logEvent('answer_created', {
            question_id: questionId
        });
    })
    .catch((error) => {
        console.error('답변 추가 중 오류 발생:', error);
        alert('답변 등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
        
        // 오류 이벤트 로깅
        analytics.logEvent('answer_create_error', { 
            error_message: error.message 
        });
    })
    .finally(() => {
        // 버튼 상태 복원
        submitBtn.disabled = false;
        submitBtn.textContent = '답변 등록';
    });
}

// 샘플 데이터 추가 (개발 편의를 위한 함수)
function addSampleDataToFirestore() {
    const sampleQuestions = [
        {
            username: '김학생',
            subject: '수학',
            title: '미분 방정식 풀이에 대해 질문있습니다',
            content: '2차 미분 방정식 dy/dx + y = 0의 일반해를 구하는 방법을 알려주세요.',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            answers: [
                {
                    id: '1000',
                    username: '이선생',
                    content: '이 방정식은 특성방정식 r + 1 = 0을 풀어서 r = -1을 구한 다음, y = Ce^(-x) 형태의 해를 얻을 수 있습니다.',
                    date: new Date().toLocaleDateString()
                }
            ]
        },
        {
            username: '박학생',
            subject: '과학',
            title: '광합성 과정에 대해 궁금합니다',
            content: '식물의 광합성 과정에서 빛 에너지가 어떻게 화학 에너지로 변환되는지 설명해주실 수 있나요?',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            answers: []
        }
    ];
    
    // 샘플 데이터 추가
    const batch = db.batch();
    
    sampleQuestions.forEach((question) => {
        const newQuestionRef = db.collection('questions').doc();
        batch.set(newQuestionRef, question);
    });
    
    // 일괄 처리 실행
    batch.commit()
        .then(() => {
            console.log('샘플 데이터가 성공적으로 추가되었습니다.');
            loadQuestionsFromFirestore();
            
            // 이벤트 로깅
            analytics.logEvent('sample_data_added');
        })
        .catch((error) => {
            console.error('샘플 데이터 추가 중 오류 발생:', error);
            
            // 오류 이벤트 로깅
            analytics.logEvent('sample_data_error', { 
                error_message: error.message 
            });
        });
}

// 아래 주석을 해제하면 샘플 데이터를 추가합니다.
// 한 번만 실행한 후 다시 주석 처리하세요.
// addSampleDataToFirestore();
