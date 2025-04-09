// Firebase 구성 정보
// Firebase 콘솔에서 복사한 구성 정보로 교체하세요
const firebaseConfig = {
  apiKey: "AIzaSyC_CUv8lQmok4PAnTV58SqydS1q-KkBqcA",
  authDomain: "qna3-ec3d1.firebaseapp.com",
  projectId: "qna3-ec3d1",
  storageBucket: "qna3-ec3d1.firebasestorage.app",
  messagingSenderId: "1021754143495",
  appId: "1:1021754143495:web:77664e1e5e3070e8988ba2",
  measurementId: "G-ECZVQS641K"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 인스턴스 생성
const db = firebase.firestore();

// Analytics 초기화
const analytics = firebase.analytics();

// 타임스탬프 설정
db.settings({ timestampsInSnapshots: true }); 