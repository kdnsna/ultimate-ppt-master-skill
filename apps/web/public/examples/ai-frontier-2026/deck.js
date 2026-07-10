(() => {
  const deck = document.querySelector('.deck');
  const slides = [...document.querySelectorAll('.slide')];
  const nav = document.querySelector('.nav');
  const counter = document.querySelector('.counter');
  const progress = document.querySelector('.progress');
  let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));
  let locked = false;

  slides.forEach((slide, index) => {
    slide.setAttribute('aria-label', `Slide ${index + 1} of ${slides.length}`);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Go to slide ${index + 1}`);
    button.addEventListener('click', () => go(index));
    nav.appendChild(button);
  });

  function go(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    deck.style.transform = `translate3d(${-current * 100}vw, 0, 0)`;
    [...nav.children].forEach((button, i) => button.setAttribute('aria-current', i === current ? 'true' : 'false'));
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.setProperty('--progress', `${((current + 1) / slides.length) * 100}%`);
    document.body.dataset.slideTheme = slides[current].classList.contains('dark') ? 'dark' : 'light';
    if (updateHash) history.replaceState(null, '', `#${current + 1}`);
  }

  addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') go(current + 1);
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(current - 1);
    if (event.key === 'Home') go(0);
    if (event.key === 'End') go(slides.length - 1);
  });

  addEventListener('wheel', event => {
    if (locked || Math.abs(event.deltaX + event.deltaY) < 28) return;
    locked = true;
    go(current + (event.deltaX + event.deltaY > 0 ? 1 : -1));
    setTimeout(() => { locked = false; }, 620);
  }, { passive: true });

  let touchX = 0;
  addEventListener('touchstart', event => { touchX = event.touches[0].clientX; }, { passive: true });
  addEventListener('touchend', event => {
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 45) go(current + (delta < 0 ? 1 : -1));
  }, { passive: true });

  go(current, false);
})();
