// 여기만 고치면 돼요
window.PEPERO_CONFIG = {
  // 받는 사람 (주소 끝에 ?to=이름 을 붙이면 그 이름이 우선)
  to: "Wooyeol",

  // 보내는 사람
  from: "Dasom",

  // 사진 비가 끝나면 바로 열리는 편지 (한글, 줄바꿈은 \n)
  letterTo: "우열",
  letterFrom: "다솜",
  message: "우열아, 우리의 빼빼로데이인데\n너를 위한 특별한 빼빼로야.\n내가 제일 사랑해!\n\n우리 아이엘츠도 홧팅하구\n박사 유학도 홧팅이구\n앞으로도 잘 부탁해.\n사랑해! ♥",

  // 빼빼로 컨셉: milk, white, berry, matcha, neon, cyber, galaxy, gold, rainbow, random
  // (neon·cyber·galaxy 는 밤하늘 배경)
  concept: "neon",

  // 사진 (몇 장이든 OK). shape: circle / heart / star / cat / flower
  // 얼굴이 가운데가 아니면 focusX, focusY 로 위치 지정 (0~1, 기본 0.5)
  photos: [
    { src: "photos/1.jpg",  shape: "heart" },
    { src: "photos/2.jpg",  shape: "circle" },
    { src: "photos/3.jpg",  shape: "cat" },
    { src: "photos/4.jpg",  shape: "star" },
    { src: "photos/5.jpg",  shape: "heart" },
    { src: "photos/6.jpg",  shape: "flower" },
    { src: "photos/8.jpg",  shape: "circle" },
    { src: "photos/9.jpg",  shape: "cat" },
    { src: "photos/10.jpg", shape: "star" },
    { src: "photos/11.jpg", shape: "flower" },
    { src: "photos/12.jpg", shape: "heart" },
    { src: "photos/13.jpg", shape: "circle" },
    { src: "photos/14.jpg", shape: "cat" },
    { src: "photos/15.jpg", shape: "heart" },
    { src: "photos/16.jpg", shape: "flower" },
    { src: "photos/17.jpg", shape: "cat" },
    { src: "photos/18.jpg", shape: "circle" },
    { src: "photos/19.jpg", shape: "heart" },
  ],
};
