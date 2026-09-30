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
// --- Notlar ---
const notFormu = document.getElementById('not-formu');
const notGirdisi = document.getElementById('not-girdisi');
const notListesi = document.getElementById('not-listesi');
const notBos = document.getElementById('not-bos');

let notlar = JSON.parse(localStorage.getItem('notlar')) || [];

function notlariKaydet() {
  localStorage.setItem('notlar', JSON.stringify(notlar));
}

function notlariCiz() {
  notListesi.innerHTML = '';

  notlar.forEach((not) => {
    const li = document.createElement('li');
    li.className = 'not';

    const metin = document.createElement('p');
    metin.textContent = not.metin;

    const alt = document.createElement('div');
    alt.className = 'not-alt';

    // not.id aslında eklenme anının zaman damgası, tarihi ondan üretiyoruz
    const tarih = document.createElement('span');
    tarih.textContent = new Date(not.id).toLocaleString('tr-TR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const sil = document.createElement('button');
    sil.className = 'sil-btn';
    sil.textContent = '×';
    sil.setAttribute('aria-label', 'Notu sil');
    sil.addEventListener('click', () => {
      notlar = notlar.filter((n) => n.id !== not.id);
      notlariKaydet();
      notlariCiz();
    });

    alt.append(tarih, sil);
    li.append(metin, alt);
    notListesi.appendChild(li);
  });

  notBos.hidden = notlar.length > 0;
}

notFormu.addEventListener('submit', (e) => {
  e.preventDefault();
  const metin = notGirdisi.value.trim();
  if (!metin) return;

  // unshift: yeni notu listenin başına ekler, en yeni not en üstte görünür
  notlar.unshift({ id: Date.now(), metin: metin });
  notGirdisi.value = '';
  notlariKaydet();
  notlariCiz();
});

notlariCiz();
