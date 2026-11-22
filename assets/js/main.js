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

// 이력서 대외활동 · 수상: 접기 · 펼치기(CSS)에 맞춰 연도는 보이는 줄 중 그 해 첫 줄에만
document.querySelectorAll('.awards').forEach((box) => {
  const items = [...box.querySelectorAll('.rows li')];
  const setYears = () => {
    let prev;
    items.forEach((li) => {
      if (!li.getClientRects().length) return; // 숨은 줄은 건너뜀
      li.firstElementChild.textContent = li.dataset.year === prev ? '' : li.dataset.year;
      prev = li.dataset.year;
    });
  };
  box.querySelector('.awards__more').addEventListener('toggle', setYears);
  setYears();
});

// 프로젝트 칸 · 포트폴리오 카드 (누르면 상세 팝업)
const works = [...document.querySelectorAll('.work')];

// 크게 보기 (기획서 · 사진 공통, 2026-11-15 B): [이전] 큰 이미지 + 설명 [다음] / 아래 작은 이미지 목록, 위 막대 "이름 n / 전체"
// 키보드 ← → · 휴대폰 밀기. 사진은 끝에서 처음으로, 기획서는 첫 쪽 · 마지막 쪽에서 멈춤
const viewer = document.querySelector('.viewer');
const viewerPages = viewer.querySelector('.viewer__pages');
const pageNo = (n) => String(n).padStart(2, '0');
const arrow = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
let gal = { items: [], no: 0, loop: true };
const galShow = (n, smooth = true) => {
  const { items, loop } = gal;
  gal.no = loop ? (n + items.length) % items.length : Math.min(Math.max(n, 0), items.length - 1);
  const it = items[gal.no];
  viewer.querySelector('.gal__count').textContent = `${gal.no + 1} / ${items.length}`;
  const img = viewerPages.querySelector('.gal__img');
  img.src = it.full;
  img.alt = it.alt;
  const cap = viewerPages.querySelector('.gal figcaption');
  cap.textContent = it.cap;
  cap.hidden = !it.cap;
  const [prev, next] = viewerPages.querySelectorAll('.gal__nav');
  prev.disabled = !loop && gal.no === 0;
  next.disabled = !loop && gal.no === items.length - 1;
  const strip = viewerPages.querySelector('.gal__thumbs');
  strip.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === gal.no));
  const cur = strip.children[gal.no];
  strip.scrollTo({ left: cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' }); // 목록이 길면(기획서) 지금 것을 가운데로
  [gal.no + 1, gal.no - 1].forEach((k) => { const x = items[loop ? (k + items.length) % items.length : k]; if (x) new Image().src = x.full; }); // 옆 것 미리 불러오기
};
// items = [{ full: 큰 이미지, alt, cap: 설명(없으면 ''), name: 목록 버튼 이름, thumb: 목록에 넣을 작은 img }]
const openGallery = (label, items, start, loop, stripClass, unit, ratio = '') => {
  gal = { items, no: start, loop };
  viewer.querySelector('.viewer__title').replaceChildren(label, Object.assign(document.createElement('span'), { className: 'gal__count' }));
  const box = document.createElement('div');
  box.className = 'gal';
  box.innerHTML = `<button class="gal__nav" type="button" data-d="-1" aria-label="이전 ${unit}">${arrow('m15 18-6-6 6-6')}</button>`
    + '<figure class="gal__fig"><img class="gal__img" alt=""><figcaption></figcaption></figure>'
    + `<button class="gal__nav" type="button" data-d="1" aria-label="다음 ${unit}">${arrow('m9 18 6-6-6-6')}</button>`;
  box.addEventListener('click', (e) => { const b = e.target.closest('.gal__nav'); if (b) galShow(gal.no + +b.dataset.d); });
  let sx = null; // 휴대폰 밀기 (50px 이상)
  box.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (sx !== null && Math.abs(dx) > 50) galShow(gal.no + (dx < 0 ? 1 : -1));
    sx = null;
  });
  const strip = document.createElement('div');
  strip.className = `gal__thumbs ${stripClass}`;
  strip.style.cssText = ratio; // 사진 칸의 --ratio (게임 화면 비율)를 목록에도
  strip.append(...items.map((it, k) => {
    const b = Object.assign(document.createElement('button'), { type: 'button' });
    b.setAttribute('aria-label', `${it.name} 보기`);
    b.append(it.thumb);
    b.addEventListener('click', () => galShow(k));
    return b;
  }));
  viewerPages.replaceChildren(box, strip);
  viewer.showModal();
  galShow(start, false); // 열린 뒤에 해야 목록 위치를 잴 수 있음
};
viewer.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') galShow(gal.no - 1);
  if (e.key === 'ArrowRight') galShow(gal.no + 1);
});
// 기획서: 한 쪽씩, 아래 목록 = 모든 쪽 작은 이미지(sNN.jpg, 화면에 보이는 것만 불러옴)
const openViewer = (doc, n) => {
  const t = doc.dataset.title;
  openGallery(t, Array.from({ length: +doc.dataset.pages }, (_, i) => ({
    full: `${doc.dataset.doc}/${pageNo(i + 1)}.jpg`, alt: `${t} ${i + 1}쪽`, cap: '', name: `${i + 1}쪽`,
    thumb: Object.assign(new Image(320, 180), { loading: 'lazy', alt: '', src: `${doc.dataset.doc}/s${pageNo(i + 1)}.jpg` }),
  })), n - 1, false, 'gal__thumbs--doc', '쪽');
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

// 상세 팝업: 누른 칸 · 카드의 분류 · 요약 배지 · 제목 + <template> 내용. 닫을 때 비워서 영상도 정지
const modal = document.querySelector('.modal');
const modalContent = modal.querySelector('.modal__content');
const closeModal = () => { modalContent.replaceChildren(); modal.close(); };
// 프로젝트 팝업의 다른 프로젝트 목록: 팝업 위쪽 대표 이미지(프로젝트 칸 순서). PC = 팝업 왼쪽 세로, 1023px 이하 = 팝업 맨 위 가로 한 줄
const projNav = Object.assign(document.createElement('nav'), { className: 'modal__nav' });
projNav.setAttribute('aria-label', '다른 프로젝트');
modalContent.before(projNav);
const openWork = (w) => {
  const detail = w.querySelector('template').content.cloneNode(true);
  const title = w.querySelector('.work__title').cloneNode(true);
  title.className = 'modal__title';
  title.id = 'modal-title';
  title.querySelectorAll('br').forEach((br) => br.replaceWith(' ')); // 팝업에서는 한 줄 (넘치면 자연스럽게 줄바꿈)
  detail.querySelectorAll('.doc').forEach(fillDoc);
  const top = Object.assign(document.createElement('div'), { className: 'modal__top' });
  const cat = w.querySelector('.work__cat').cloneNode(true);
  cat.className = 'work__cat'; // 칸 · 카드용 꾸밈 클래스는 빼고 팝업 기본 모양으로
  top.append(cat);
  const badge = w.querySelector('.tile__badge'); // 프로젝트 칸만
  if (badge) top.append(Object.assign(badge.cloneNode(true), { className: 'modal__badge' }));
  detail.querySelector('.modal__info, .modal__body').prepend(top, title); // 프로젝트 = 위쪽 요약 칸, 기획서 = 본문
  modalContent.replaceChildren(detail);
  projNav.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', b.dataset.id === w.id));
  if (!modal.open) modal.showModal(); // 목록에서 바꿀 때는 열린 그대로 내용만
  modal.scrollTop = 0;
  const cur = projNav.querySelector('[aria-current="true"]');
  if (cur) projNav.scrollLeft = cur.offsetLeft - 12; // 가로 한 줄일 때 지금 프로젝트가 보이게
};
works.forEach((w) => w.querySelector('.work__more').addEventListener('click', () => openWork(w)));
document.querySelectorAll('.bento .work').forEach((w) => {
  const src = w.querySelector('template').content.querySelector('.modal__media img');
  const b = Object.assign(document.createElement('button'), { type: 'button' });
  b.dataset.id = w.id; // data-work는 이력서 버튼용이라 쓰지 않음
  b.setAttribute('aria-label', `${w.querySelector('.work__title').textContent} 보기`);
  const img = Object.assign(new Image(), { loading: 'lazy', alt: '', src: src.getAttribute('src') });
  img.style.objectPosition = src.style.objectPosition;
  b.append(img);
  b.addEventListener('click', () => openWork(w));
  projNav.append(b);
});
modal.querySelector('.modal__close').addEventListener('click', closeModal);
// 위쪽 이미지의 ▶: 그 자리에서 유튜브 영상으로 바꿔 바로 재생
modalContent.addEventListener('click', (e) => {
  const b = e.target.closest('.modal__play');
  if (!b) return;
  const f = Object.assign(document.createElement('iframe'), {
    src: `${b.dataset.src}${b.dataset.src.includes('?') ? '&' : '?'}autoplay=1`,
    title: b.dataset.title,
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowFullscreen: true,
  });
  b.parentElement.classList.add('is-playing');
  b.parentElement.replaceChildren(f);
  f.focus(); // 누른 버튼이 사라지므로 키보드 위치를 영상으로
});
// 전시 · 수상 사진 · 게임 스크린샷: 누르면 크게 보기에서 같은 칸 사진끼리 넘기기 (목록 = 팝업의 작은 사진 그대로)
modalContent.addEventListener('click', (e) => {
  const b = e.target.closest('.photos__btn');
  if (!b) return;
  const group = b.closest('.photos');
  const btns = [...group.querySelectorAll('.photos__btn')];
  const label = group.closest('.modal__row').querySelector('.modal__label').textContent;
  openGallery(label, btns.map((x, k) => {
    const cap = x.parentElement.querySelector('figcaption')?.textContent || '';
    return { full: x.dataset.full, alt: cap || label, cap, name: `${k + 1}번째 사진`, thumb: x.querySelector('img').cloneNode() };
  }), btns.indexOf(b), true, ['shots', 'tall'].map((k) => (group.classList.contains(`photos--${k}`) ? `gal__thumbs--${k}` : '')).join(''), '사진', group.style.cssText);
});
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); }); // 바깥 어두운 곳
// Esc 키. close 이벤트는 늦게 올 수 있어, 그사이 다른 카드를 열었으면 비우지 않음
modal.addEventListener('close', () => { if (!modal.open) modalContent.replaceChildren(); });
// 이력서의 프로젝트 이름: 누르면 프로젝트 칸과 같은 상세 팝업 (data-work = 칸 id)
document.querySelectorAll('[data-work]').forEach((b) => b.addEventListener('click', () => {
  document.getElementById(b.dataset.work).querySelector('.work__more').click();
}));

// 기획서 · 이력서 PDF 다운로드: download 속성을 무시하고 PDF를 미리 보기로 여는 브라우저가 있어,
// 파일을 받아 "내려받기 전용" 형식으로 바꾼 뒤 저장. 실패하면 원래 링크로 이동
// (아래에서 만든 임시 blob: 링크는 .pdf로 끝나지 않아 여기 안 걸리고 그대로 저장됨)
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[download][href$=".pdf"]');
  if (!a) return;
  e.preventDefault();
  const label = a.lastChild.textContent;
  a.lastChild.textContent = ' 다운로드 중…';
  try {
    const res = await fetch(a.href);
    if (!res.ok) throw new Error(res.status);
    const url = URL.createObjectURL(new Blob([await res.blob()], { type: 'application/octet-stream' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: decodeURIComponent(a.pathname.split('/').pop()) });
    a.after(link); // 팝업 밖(비활성 영역)에 두면 클릭이 막힐 수 있어 누른 버튼 바로 옆에서 클릭
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    location.href = a.href;
  }
  a.lastChild.textContent = label;
});

// 플레이경험 게임 정보 팝업 (data-game이 있는 아이콘만): 마우스 올리면 표시 · 빼면 닫힘 / 터치하면 표시 · 3초 뒤 닫힘 / Tab 포커스 시 표시
const playBox = document.querySelector('.play__games');
const playTip = playBox.querySelector('.play__tip');
let playTimer;
const tipCell = (label, value, wide) => `<div class="play__tip-box${wide ? ' play__tip-box--wide' : ''}"><span>${label}</span><b>${value}</b></div>`;
const hideTip = () => { playTip.hidden = true; clearTimeout(playTimer); };
const showTip = (li, autoClose) => {
  const { game, levelName, level, time, note } = li.dataset;
  const badge = li.dataset.badge || ('max' in li.dataset ? 'MAX' : ''); // 레벨 옆 배지: 만렙 MAX 또는 직업 등
  playTip.innerHTML = `<p class="play__tip-name">${game}</p><div class="play__tip-boxes">` +
    tipCell(levelName, level + (badge ? `<span class="play__tip-max">${badge}</span>` : '')) + tipCell('플레이 타임', time) + (note ? tipCell('특이사항', note, true) : '') + '</div>';
  playTip.hidden = false;
  // 아이콘 가운데 위에 놓되, 칸 양끝을 넘지 않게
  const b = playBox.getBoundingClientRect(), r = li.getBoundingClientRect();
  const center = r.left - b.left + r.width / 2;
  const left = Math.min(Math.max(center - playTip.offsetWidth / 2, 8), b.width - playTip.offsetWidth - 8);
  playTip.style.left = `${left}px`;
  playTip.style.top = `${r.top - b.top - 10}px`;
  playTip.style.setProperty('--arrow', `${center - left}px`);
  li.setAttribute('aria-describedby', 'play-tip');
  clearTimeout(playTimer);
  if (autoClose) playTimer = setTimeout(hideTip, 3000);
};
playBox.addEventListener('pointerover', (e) => {
  const li = e.target.closest('li[data-game]');
  if (li) showTip(li, e.pointerType !== 'mouse');
});
playBox.addEventListener('pointerout', (e) => {
  const li = e.target.closest('li[data-game]');
  if (e.pointerType === 'mouse' && li && !li.contains(e.relatedTarget)) hideTip();
});
// 키보드로 이동했을 때만. 터치로 생긴 포커스는 무시해야 3초 자동 닫힘이 유지됨
playBox.addEventListener('focusin', (e) => {
  const li = e.target.closest('li[data-game]');
  if (li && li.matches(':focus-visible')) showTip(li, false);
});
playBox.addEventListener('focusout', hideTip);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideTip(); });

// 연락처 복사 버튼: 누르면 잠깐 "복사됨"
document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = '복사됨'; }
  catch { b.textContent = '복사 실패'; }
  setTimeout(() => { b.textContent = '복사'; }, 1500);
}));
