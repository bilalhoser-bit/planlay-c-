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
// --- Haftalık görünüm ---
const haftaBaslik = document.getElementById('hafta-baslik');
const haftaIzgarasi = document.getElementById('hafta-izgarasi');
const oncekiHafta = document.getElementById('onceki-hafta');
const sonrakiHafta = document.getElementById('sonraki-hafta');
const buHaftaDugmesi = document.getElementById('bu-hafta');

// Verilen günün haftasının Pazartesi'sini bulur
function pazartesiBul(d) {
  const kopya = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const gunNo = (kopya.getDay() + 6) % 7; // Pazartesi = 0, Pazar = 6
  kopya.setDate(kopya.getDate() - gunNo);
  return kopya;
}

let haftaBaslangici = pazartesiBul(new Date());

function haftaDegistir(fark) {
  haftaBaslangici = new Date(
    haftaBaslangici.getFullYear(),
    haftaBaslangici.getMonth(),
    haftaBaslangici.getDate() + fark * 7
  );
  haftaCiz();
}

function haftaCiz() {
  const son = new Date(
    haftaBaslangici.getFullYear(),
    haftaBaslangici.getMonth(),
    haftaBaslangici.getDate() + 6
  );
  const kisa = { day: 'numeric', month: 'long' };
  haftaBaslik.textContent =
    haftaBaslangici.toLocaleDateString('tr-TR', kisa) + ' – ' + son.toLocaleDateString('tr-TR', kisa);

  haftaIzgarasi.innerHTML = '';
  const bugun = tarihYaz(new Date());

  for (let i = 0; i < 7; i++) {
    const gun = new Date(
      haftaBaslangici.getFullYear(),
      haftaBaslangici.getMonth(),
      haftaBaslangici.getDate() + i
    );
    const tarih = tarihYaz(gun);

    const gunGorevleri = gorevler
      .filter((g) => g.tarih === tarih)
      .sort((a, b) => (a.saat || '99:99').localeCompare(b.saat || '99:99'));
    const tamamlanan = gunGorevleri.filter((g) => g.tamam).length;

    const kart = document.createElement('div');
    kart.className = 'hafta-gun' + (tarih === bugun ? ' bugun' : '');

    // Başlığa tıklayınca o günün günlük sayfası açılır
    const baslik = document.createElement('button');
    baslik.type = 'button';
    baslik.className = 'hafta-gun-baslik';
    baslik.title = 'Bu günü aç';

    const ad = document.createElement('strong');
    ad.textContent = gun.toLocaleDateString('tr-TR', { weekday: 'long' });

    const bilgi = document.createElement('small');
    let bilgiMetni = gun.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    if (gunGorevleri.length > 0) {
      bilgiMetni += ' (' + tamamlanan + '/' + gunGorevleri.length + ')';
    }
    bilgi.textContent = bilgiMetni;

    baslik.append(ad, bilgi);
    baslik.addEventListener('click', () => {
      seciliTarih = tarih;
      ciz();
      document.querySelector('[data-target="gunluk"]').click();
    });
    kart.appendChild(baslik);

    if (gunGorevleri.length === 0) {
      const bos = document.createElement('p');
      bos.className = 'hafta-bos';
      bos.textContent = 'Görev yok';
      kart.appendChild(bos);
    } else {
      const ul = document.createElement('ul');
      ul.className = 'hafta-gorevler';

      gunGorevleri.forEach((gorev) => {
        const li = document.createElement('li');
        li.className = 'hafta-gorev oncelik-' + gorev.oncelik + (gorev.tamam ? ' tamam' : '');

        const kutu = document.createElement('input');
        kutu.type = 'checkbox';
        kutu.checked = gorev.tamam;
        kutu.setAttribute('aria-label', gorev.metin + ' tamamlandı');
        kutu.addEventListener('change', () => {
          gorev.tamam = kutu.checked;
          kaydet();
          haftaCiz();
          ciz(); // günlük görünümü de güncel tut
        });
        li.appendChild(kutu);

        if (gorev.saat) {
          const saat = document.createElement('span');
          saat.className = 'hafta-gorev-saat';
          saat.textContent = gorev.saat;
          li.appendChild(saat);
        }

        const metin = document.createElement('span');
        metin.className = 'hafta-gorev-metin';
        metin.textContent = gorev.metin;
        li.appendChild(metin);

        ul.appendChild(li);
      });

      kart.appendChild(ul);
    }

    haftaIzgarasi.appendChild(kart);
  }
}

oncekiHafta.addEventListener('click', () => haftaDegistir(-1));
sonrakiHafta.addEventListener('click', () => haftaDegistir(1));
buHaftaDugmesi.addEventListener('click', () => {
  haftaBaslangici = pazartesiBul(new Date());
  haftaCiz();
});

// Günlük sekmesinde yapılan değişiklikler haftalığa da yansısın
document.querySelector('[data-target="haftalik"]').addEventListener('click', haftaCiz);

haftaCiz();