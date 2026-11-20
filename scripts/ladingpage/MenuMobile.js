document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-label', 'Abrir menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  const fechar = () => {
    nav.classList.remove('aberto');
    btn.setAttribute('aria-expanded', 'false');
  };

  btn.addEventListener('click', () => {
    const aberto = nav.classList.toggle('aberto');
    btn.setAttribute('aria-expanded', String(aberto));
  });

  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', fechar));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) fechar(); });
});