(() => {
  const deck = document.querySelector('.deck');
  const slides = [...document.querySelectorAll('.slide')];
  const nav = document.querySelector('.nav');
  const counter = document.querySelector('.counter');
  const progress = document.querySelector('.progress');
  let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));
  let locked = false;

  slides.forEach((slide, index) => {
    slide.setAttribute('aria-label', `第 ${index + 1} 页，共 ${slides.length} 页`);
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `前往第 ${index + 1} 页`);
    button.addEventListener('click', () => go(index));
    button.addEventListener('keydown', event => {
      let target = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = Math.min(slides.length - 1, index + 1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = Math.max(0, index - 1);
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = slides.length - 1;
      else if (event.key === ' ' || event.key === 'Enter') {
        event.stopPropagation();
        return;
      } else {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      go(target);
      nav.children[target].focus();
    });
    nav.appendChild(button);
  });

  function go(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    deck.style.transform = `translate3d(${-current * 100}vw, 0, 0)`;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.inert = !active;
    });
    [...nav.children].forEach((button, i) => {
      const active = i === current;
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });
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
