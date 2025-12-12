/* ========== 헤더 스크롤 색상 변경 ========== */
const header = document.querySelector("header");
const hero = document.querySelector("#hero_big");

if (header && hero && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // hero_big 에 있을 땐 투명
          header.classList.remove("light");
        } else {
          // hero_big 벗어나면 항상 흰색
          header.classList.add("light");
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(hero);
}



/* ========== 메인 이미지 바뀌는 거 (index.html에만) ========== */

document.addEventListener("DOMContentLoaded", async () => {
  const hero = document.getElementById("hero_big");
  if (!hero) return;

  const images = [
    "./css/img/meal.png",
    "./css/img/greenapple.png",
    "./css/img/redapple.png"
  ];

  // 시간 관련 상수 (위로 올림)
  const fadeDuration = 1600;          // ms
  const stayDuration = 3400;          // ms
  const cycleDuration = fadeDuration + stayDuration; // 5000ms

  /*1) 모든 이미지 decode 완료 후 시작 */
  await Promise.all(
    images.map(src => {
      return new Promise(async resolve => {
        const img = new Image();
        img.src = src;

        try {
          await img.decode();
        } catch (e) {
          // decode를 지원하지 않거나 에러가 나도 그냥 넘어감
        }

        resolve();
      });
    })
  );

  let currentIndex = 0;

  hero.style.position = "relative";
  hero.style.overflow = "hidden";

  const heroContent = hero.querySelector(".hero-section");
  if (heroContent) {
    heroContent.style.position = "relative";
    heroContent.style.zIndex = "2";
  }

  function createLayer() {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = 0;
    div.style.left = 0;
    div.style.width = "100%";
    div.style.height = "100%";
    div.style.backgroundSize = "cover";
    div.style.backgroundPosition = "center";
    div.style.opacity = 0;

    // transition을 fadeDuration과 동기화
    div.style.transition = `opacity ${fadeDuration}ms ease-in-out`;
    div.style.zIndex = 0;
    hero.insertBefore(div, hero.firstChild);
    return div;
  }

  const layerA = createLayer();
  const layerB = createLayer();

  let showing = layerA;
  let hidden = layerB;

  
  layerA.style.backgroundImage = `url('${images[currentIndex]}')`;
  layerA.style.opacity = 1;

  function crossFade() {
    const nextIndex = (currentIndex + 1) % images.length;

  
    hidden.style.transition = "none";
    hidden.style.opacity = 0;
    hidden.style.backgroundImage = `url('${images[nextIndex]}')`;

    // 강제 리플로우로 transition 초기화 적용
    void hidden.offsetWidth;
    hidden.style.transition = `opacity ${fadeDuration}ms ease-in-out`;
    hidden.style.opacity = 1;

  
    showing.style.opacity = 0;

   
    setTimeout(() => {
      const t = showing;
      showing = hidden;
      hidden = t;

      currentIndex = nextIndex;
    }, fadeDuration);
  }


  function startSlideshow() {
   
    let nextFadeStart = performance.now() + stayDuration;

    function tick() {
      const now = performance.now();
      const drift = now - nextFadeStart; 
      crossFade();

      
      nextFadeStart += cycleDuration;
      const nextDelay = Math.max(0, cycleDuration - drift);

      setTimeout(tick, nextDelay);
    }

    setTimeout(tick, stayDuration);
  }

  startSlideshow();
});



/* ========== LIFE 카드 더보기 (life 페이지에만) ========== */
document.addEventListener("DOMContentLoaded", () => {
  const loadMoreButton = document.getElementById("loadMore");
  const cardGrid = document.querySelector(".card-grid");

  if (!loadMoreButton || !cardGrid) return;  // ★ 없으면 바로 종료

  const hiddenCards = cardGrid.querySelectorAll(".card.hidden");
  let cardsVisible = false;

  loadMoreButton.addEventListener("click", () => {
    if (!cardsVisible) {
      hiddenCards.forEach(card => card.classList.remove("hidden"));
      loadMoreButton.textContent = "하나로 LIFE 접기";
      cardsVisible = true;
    } else {
      hiddenCards.forEach(card => card.classList.add("hidden"));
      loadMoreButton.textContent = "하나로 LIFE 더보기";
      cardsVisible = false;
      cardGrid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});


/* ========== 하나로 소개: 원 hover → 배경 이미지 변경 (information.html) ========== */
// js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const grayBox = document.querySelector(".container");
  const circles = document.querySelectorAll(".circle");

  if (!grayBox || circles.length === 0) return;

  const images = {
    bg1: "url('./css/infoimg/fresh.png')",
    bg2: "url('./css/infoimg/too.png')",
    bg3: "url('./css/infoimg/real.png')"
  };

  circles.forEach(circle => {
    const key = circle.dataset.bg;

    circle.addEventListener("mouseenter", () => {
      grayBox.style.backgroundImage = images[key];
    });

    circle.addEventListener("mouseleave", () => {
      grayBox.style.backgroundImage = "";
    });
  });
});

/* ============================================
   연혁 섹션 스크롤 애니메이션 (JS만 사용)
   - .history-block 이 뷰포트에 들어오면 is-active 추가
   - 다시 나가면 is-active 제거 → 위로 갔다가 내려와도 다시 슥 올라옴
============================================ */
document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("infopage")) return;

    const blocks = document.querySelectorAll(".history-block");
    const topSection = document.querySelector(".historypage .top");

    if (!blocks.length || !topSection) return;

    // 상단 설명 섹션 높이 계산
    const triggerPoint = topSection.offsetHeight + 200;  
    // ↑ 소개문이 끝난 지점 + 여유 200px (딱 너가 말한 위치)

    // 초기 상태: 숨김
    blocks.forEach(block => {
        block.style.opacity = "0";
        block.style.transform = "translateY(120px)";
        block.dataset.active = "false";
    });

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;

        blocks.forEach(block => {
            const blockTop = block.offsetTop;

            // 스크롤이 소개문 끝 + 여유치 보다 내려오면 등장
            if (scrollY + window.innerHeight * 0.2 >= blockTop - triggerPoint) {

                if (block.dataset.active === "false") {
                    block.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
                    block.style.opacity = "1";
                    block.style.transform = "translateY(0)";
                    block.dataset.active = "true";
                }

            } else {
                // 다시 위로 올라갈 때는 초기화
                block.style.opacity = "0";
                block.style.transform = "translateY(120px)";
                block.dataset.active = "false";
            }
        });
    });
});


