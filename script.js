// Sekmeler arasında geçiş: tıklanan sekmeyi ve ona ait bölümü göster
const sekmeler = document.querySelectorAll('.tab');
const bolumler = document.querySelectorAll('.panel');

sekmeler.forEach((sekme) => {
  sekme.addEventListener('click', () => {
    sekmeler.forEach((s) => s.classList.remove('active'));
    bolumler.forEach((b) => b.classList.remove('active'));

    sekme.classList.add('active');
    document.getElementById(sekme.dataset.target).classList.add('active');
  });
});
