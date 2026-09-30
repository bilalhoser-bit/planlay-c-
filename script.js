// --- Sekmeler arasında geçiş ---
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

// --- Günlük görevler ---
const gunGirdisi = document.getElementById('gun-girdisi');
const gunBaslik = document.getElementById('gun-baslik');
const oncekiGun = document.getElementById('onceki-gun');
const sonrakiGun = document.getElementById('sonraki-gun');
const form = document.getElementById('gorev-formu');
const girdi = document.getElementById('gorev-girdisi');
const saatGirdisi = document.getElementById('gorev-saat');
const oncelikSecimi = document.getElementById('gorev-oncelik');
const kategoriSecimi = document.getElementById('gorev-kategori');
const liste = document.getElementById('gorev-listesi');
const bosMesaj = document.getElementById('bos-mesaj');

const KATEGORILER = { ders: 'Ders', is: 'İş', kisisel: 'Kişisel' };
const ONCELIKLER = { yuksek: 'yüksek', orta: 'orta', dusuk: 'düşük' };

// Tarihi 'YYYY-MM-DD' biçiminde verir (bilgisayarının yerel saatine göre)
function tarihYaz(d) {
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, '0');
  const gun = String(d.getDate()).padStart(2, '0');
  return `${yil}-${ay}-${gun}`;
}

let seciliTarih = tarihYaz(new Date());

// Eski görevlerde tarih, saat, öncelik, kategori yok: eksikleri varsayılanla doldur
let gorevler = (JSON.parse(localStorage.getItem('gorevler')) || []).map((g) => ({
  tarih: tarihYaz(new Date()),
  saat: '',
  oncelik: 'orta',
  kategori: 'kisisel',
  ...g,
}));

function kaydet() {
  localStorage.setItem('gorevler', JSON.stringify(gorevler));
}

function gunBasligiYaz() {
  const [y, a, g] = seciliTarih.split('-').map(Number);
  const uzun = new Date(y, a - 1, g).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const bugunMu = seciliTarih === tarihYaz(new Date());
  gunBaslik.textContent = bugunMu ? 'Bugün, ' + uzun : uzun;
  gunGirdisi.value = seciliTarih;
}

// fark: -1 önceki gün, +1 sonraki gün
function gunDegistir(fark) {
  const [y, a, g] = seciliTarih.split('-').map(Number);
  seciliTarih = tarihYaz(new Date(y, a - 1, g + fark));
  ciz();
}

function ciz() {
  gunBasligiYaz();
  liste.innerHTML = '';

  // Sadece seçili günün görevlerini al ve saate göre sırala (saatsizler sona)
  const gununGorevleri = gorevler
    .filter((g) => g.tarih === seciliTarih)
    .sort((a, b) => (a.saat || '99:99').localeCompare(b.saat || '99:99'));

  gununGorevleri.forEach((gorev) => {
    const li = document.createElement('li');
    li.className = 'gorev oncelik-' + gorev.oncelik + (gorev.tamam ? ' tamam' : '');
    li.title = 'Öncelik: ' + ONCELIKLER[gorev.oncelik];

    const kutu = document.createElement('input');
    kutu.type = 'checkbox';
    kutu.checked = gorev.tamam;
    kutu.addEventListener('change', () => {
      gorev.tamam = kutu.checked;
      kaydet();
      ciz();
    });

    const saat = document.createElement('span');
    saat.className = 'gorev-saat';
    saat.textContent = gorev.saat;

    const metin = document.createElement('span');
    metin.textContent = gorev.metin;

    const etiket = document.createElement('span');
    etiket.className = 'etiket';
    etiket.textContent = KATEGORILER[gorev.kategori];

    const sil = document.createElement('button');
    sil.className = 'sil-btn';
    sil.textContent = '×';
    sil.setAttribute('aria-label', 'Görevi sil');
    sil.addEventListener('click', () => {
      gorevler = gorevler.filter((g) => g.id !== gorev.id);
      kaydet();
      ciz();
    });

    li.append(kutu, saat, metin, etiket, sil);
    liste.appendChild(li);
  });

  bosMesaj.hidden = gununGorevleri.length > 0;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const metin = girdi.value.trim();
  if (!metin) return;

  gorevler.push({
    id: Date.now(),
    metin: metin,
    tamam: false,
    tarih: seciliTarih,
    saat: saatGirdisi.value,
    oncelik: oncelikSecimi.value,
    kategori: kategoriSecimi.value,
  });

  girdi.value = '';
  saatGirdisi.value = '';
  kaydet();
  ciz();
});

oncekiGun.addEventListener('click', () => gunDegistir(-1));
sonrakiGun.addEventListener('click', () => gunDegistir(1));

gunGirdisi.addEventListener('change', () => {
  if (gunGirdisi.value) {
    seciliTarih = gunGirdisi.value;
    ciz();
  }
});

ciz();

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