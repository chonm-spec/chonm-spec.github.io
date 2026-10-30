// 화면 중앙에 걸린 섹션의 메뉴를 강조
const links = [...document.querySelectorAll('.nav__link[href^="#"]')];
const spy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => {
      const on = a.hash === `#${e.target.id}`;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-50% 0px -50% 0px' });
links.forEach((a) => {
  const section = document.querySelector(a.hash);
  if (section) spy.observe(section);
});

// 만 나이 자동 계산 (data-birth="YYYY-MM-DD")
document.querySelectorAll('[data-birth]').forEach((el) => {
  const [y, m, d] = el.dataset.birth.split('-').map(Number);
  const now = new Date();
  const beforeBirthday = now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d);
  el.textContent = now.getFullYear() - y - (beforeBirthday ? 1 : 0);
});

// 프로젝트&기획서: 분류 필터 (전체 / 프로젝트 / 기획서)
const filters = [...document.querySelectorAll('.works__filter')];
const works = [...document.querySelectorAll('.work')];
filters.forEach((f) => f.addEventListener('click', () => {
  filters.forEach((x) => x.setAttribute('aria-pressed', x === f));
  works.forEach((w) => { w.hidden = f.dataset.filter !== 'all' && w.dataset.kind !== f.dataset.filter; });
}));

// 기획서 크게 보기: 전체 쪽을 위아래로 이어서, 누른 쪽부터 보여 줌
const viewer = document.querySelector('.viewer');
const viewerPages = viewer.querySelector('.viewer__pages');
const pageNo = (n) => String(n).padStart(2, '0');
const openViewer = (doc, n) => {
  viewer.querySelector('.viewer__title').textContent = doc.dataset.title;
  viewerPages.replaceChildren(...Array.from({ length: +doc.dataset.pages }, (_, i) => Object.assign(new Image(1600, 900), {
    loading: 'lazy', src: `${doc.dataset.doc}/${pageNo(i + 1)}.jpg`, alt: `${doc.dataset.title} ${i + 1}쪽`,
  })));
  viewer.showModal();
  viewerPages.children[n - 1].scrollIntoView();
};
viewer.querySelector('.viewer__close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target === viewerPages) viewer.close(); }); // 쪽 바깥 어두운 곳

// 기획서 미리보기: 앞 4쪽, 4번째 쪽 위에 남은 쪽 수
const fillDoc = (doc) => {
  const total = +doc.dataset.pages;
  doc.querySelector('.doc__thumbs').append(...[1, 2, 3, 4].filter((n) => n <= total).map((n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'doc__page';
    if (n === 4 && total > 4) b.dataset.more = `+${total - 4}쪽`;
    b.append(Object.assign(new Image(480, 270), { src: `${doc.dataset.doc}/t${pageNo(n)}.jpg`, alt: `${n}쪽 크게 보기` }));
    b.addEventListener('click', () => openViewer(doc, n));
    return b;
  }));
};

// 상세 팝업: 누른 카드의 분류·제목 + <template> 내용. 닫을 때 비워서 영상도 정지
const modal = document.querySelector('.modal');
const modalContent = modal.querySelector('.modal__content');
const closeModal = () => { modalContent.replaceChildren(); modal.close(); };
works.forEach((w) => w.querySelector('.work__more').addEventListener('click', () => {
  const detail = w.querySelector('template').content.cloneNode(true);
  const title = w.querySelector('.work__title').cloneNode(true);
  title.className = 'modal__title';
  title.id = 'modal-title';
  title.querySelectorAll('br').forEach((br) => br.replaceWith(' ')); // 팝업에서는 한 줄 (넘치면 자연스럽게 줄바꿈)
  detail.querySelectorAll('.doc').forEach(fillDoc);
  detail.querySelector('.modal__body').prepend(w.querySelector('.work__cat').cloneNode(true), title);
  modalContent.replaceChildren(detail);
  modal.showModal();
  modal.scrollTop = 0;
}));
modal.querySelector('.modal__close').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); // 바깥 어두운 곳
// Esc 키. close 이벤트는 늦게 올 수 있어, 그사이 다른 카드를 열었으면 비우지 않음
modal.addEventListener('close', () => { if (!modal.open) modalContent.replaceChildren(); });

// 플레이경험: + more를 누르면 숨겨 둔 게임 아이콘 표시, 다시 누르면 접기
const playMore = document.querySelector('.play__more');
const playExtras = [...document.querySelectorAll('.play__extra')];
playMore.addEventListener('click', () => {
  const open = playMore.getAttribute('aria-expanded') !== 'true';
  playMore.setAttribute('aria-expanded', open);
  playMore.textContent = open ? '접기' : '+ more';
  playExtras.forEach((li) => { li.hidden = !open; });
});

// 연락처 복사 버튼: 누르면 잠깐 "복사됨"
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨'; }
  catch { b.textContent = '복사 실패'; }
  setTimeout(() => { b.textContent = '복사'; }, 1500);
}));
