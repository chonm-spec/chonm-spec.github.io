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
