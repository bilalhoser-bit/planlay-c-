// ---------- Yardımcılar ----------
const $ = (id) => document.getElementById(id);

// Küçük bir eleman üretici: el('etiket', 'sınıf', 'yazı', ...çocuklar)
const el = (tag, cls, text, ...kids) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  n.append(...kids);
  return n;
};

// ---------- Veri ----------
const ANAHTARLAR = ['gorevler', 'notlar', 'dersler', 'sinavlar', 'aliskanliklar', 'hedefler', 'vizyon', 'kazanimlar'];
const veri = {};
ANAHTARLAR.forEach((k) => (veri[k] = JSON.parse(localStorage.getItem(k)) || []));

const kaydet = () => ANAHTARLAR.forEach((k) => localStorage.setItem(k, JSON.stringify(veri[k])));
const degisti = () => { kaydet(); ciz(); };

// ---------- Tarih ----------
const yaz = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const coz = (s) => { const [y, a, g] = s.split('-').map(Number); return new Date(y, a - 1, g); };
const bugun = () => yaz(new Date());
const gunEkle = (s, n) => { const d = coz(s); d.setDate(d.getDate() + n); return yaz(d); };
const bicim = (s, secenek) => coz(s).toLocaleDateString('tr-TR', secenek);

let sec = bugun(); // seçili gün: tüm görünümler bunu kullanır

const KAT = { ders: 'Ders', is: 'İş', kisisel: 'Kişisel' };
const ONC = { yuksek: 'yüksek', orta: 'orta', dusuk: 'düşük' };
const TEKRAR = { yok: '', gunluk: '↻ her gün', haftalik: '↻ her hafta', aylik: '↻ her ay' };
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// Eski kayıtlarda eksik alanları tamamla
function duzenle() {
  veri.gorevler.forEach((g) => {
    g.tarih ??= bugun(); g.saat ??= ''; g.oncelik ??= 'orta';
    g.kategori ??= 'kisisel'; g.tekrar ??= 'yok';
    g.biten ??= g.tamam ? [g.tarih] : [];
  });
  veri.notlar.forEach((n) => { n.etiketler ??= []; });
}

// Bir günde geçerli olan görevler (tekrar edenler dahil), saate göre sıralı
function gunGorevleri(t) {
  const d = coz(t);
  return veri.gorevler
    .filter((g) => {
      if (t < g.tarih) return false;
      const b = coz(g.tarih);
      if (g.tekrar === 'gunluk') return true;
      if (g.tekrar === 'haftalik') return b.getDay() === d.getDay();
      if (g.tekrar === 'aylik') return b.getDate() === d.getDate();
      return g.tarih === t;
    })
    .sort((a, b) => (a.saat || '99:99').localeCompare(b.saat || '99:99'));
}

// ---------- Ortak parçalar ----------
const silBtn = (fn) => {
  const b = el('button', 'sil', '×');
  b.setAttribute('aria-label', 'Sil');
  b.onclick = fn;
  return b;
};

const sil = (anahtar, oge) =>
  silBtn(() => { veri[anahtar] = veri[anahtar].filter((x) => x !== oge); degisti(); });

const doldur = (id, dizi, yap, bosYazi) =>
  $(id).replaceChildren(...(dizi.length ? dizi.map((x) => yap(x)) : [el('li', 'bos', bosYazi)]));

// Bir görevin liste satırı (t: hangi günün satırı olduğu)
function gorevSatiri(g, t, silinebilir) {
  const bitti = g.biten.includes(t);
  const li = el('li', `oge ${g.oncelik}` + (bitti ? ' bitti' : ''));
  li.title = 'Öncelik: ' + ONC[g.oncelik];

  const kutu = el('input');
  kutu.type = 'checkbox';
  kutu.checked = bitti;
  kutu.setAttribute('aria-label', g.metin + ' tamamlandı');
  kutu.onchange = () => {
    g.biten = kutu.checked ? [...g.biten, t] : g.biten.filter((x) => x !== t);
    degisti();
  };
  li.append(kutu);
  if (g.saat) li.append(el('span', 'saat', g.saat));
  li.append(el('span', 'metin', g.metin));
  li.append(el('span', 'etiket', KAT[g.kategori] + (TEKRAR[g.tekrar] ? ' ' + TEKRAR[g.tekrar] : '')));

  if (silinebilir) {
    li.append(silBtn(() => {
      if (g.tekrar === 'yok' || confirm('Tekrar eden görev tüm günlerden silinecek. Silinsin mi?')) {
        veri.gorevler = veri.gorevler.filter((x) => x !== g);
        degisti();
      }
    }));
  }
  return li;
}

// ---------- Günlük ----------
function gunCiz() {
  const baslik = (sec === bugun() ? 'Bugün, ' : '') + bicim(sec, { weekday: 'long', day: 'numeric', month: 'long' });
  $('b-gun').textContent = baslik;
  $('b-program').textContent = baslik;
  doldur('g-liste', gunGorevleri(sec), (g) => gorevSatiri(g, sec, true), 'Bu gün için görev yok.');
}

// ---------- Haftalık ----------
function haftaCiz() {
  const p = gunEkle(sec, -((coz(sec).getDay() + 6) % 7)); // haftanın Pazartesi'si
  const kisa = { day: 'numeric', month: 'long' };
  $('b-hafta').textContent = bicim(p, kisa) + ' – ' + bicim(gunEkle(p, 6), kisa);

  const kartlar = [];
  for (let i = 0; i < 7; i++) {
    const t = gunEkle(p, i);
    const L = gunGorevleri(t);
    const n = L.filter((g) => g.biten.includes(t)).length;

    const bas = el('button', 'hbas', null,
      el('strong', null, bicim(t, { weekday: 'long' })),
      el('small', null, bicim(t, { day: 'numeric', month: 'short' }) + (L.length ? ` (${n}/${L.length})` : '')));
    bas.onclick = () => { sec = t; ciz(); sekmeAc('gunluk'); };

    const kart = el('div', 'hgun' + (t === bugun() ? ' bugun' : ''), null, bas);
    kart.append(...(L.length ? L.map((g) => gorevSatiri(g, t, false)) : [el('small', 'soluk', 'Görev yok')]));
    kartlar.push(kart);
  }
  $('h-izgara').replaceChildren(...kartlar);
}

// ---------- Aylık ----------
function ayCiz() {
  const d = coz(sec);
  $('b-ay').textContent = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const ilk = new Date(d.getFullYear(), d.getMonth(), 1);
  const bas = gunEkle(yaz(ilk), -((ilk.getDay() + 6) % 7));

  const hucreler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => el('div', 'ay-baslik', x));
  for (let i = 0; i < 42; i++) {
    const t = gunEkle(bas, i);
    const n = gunGorevleri(t).length;
    const sinif = 'ay-hucre'
      + (coz(t).getMonth() !== d.getMonth() ? ' disari' : '')
      + (t === bugun() ? ' bugun' : '')
      + (t === sec ? ' sec' : '')
      + (veri.sinavlar.some((s) => s.tarih === t) ? ' sinavli' : '');
    const h = el('button', sinif, null,
      el('span', null, String(coz(t).getDate())),
      el('small', null, n ? '● ' + n : ''));
    h.onclick = () => { sec = t; ciz(); sekmeAc('gunluk'); };
    hucreler.push(h);
  }
  $('a-izgara').replaceChildren(...hucreler);
}

// ---------- Saat saat program ----------
const dersOgesi = (x) => el('li', 'oge ders', null, el('span', 'metin', x.ad), el('span', 'etiket', 'Ders'));
const sinavOgesi = (x) => el('li', 'oge sinav', null, el('span', 'metin', x.ad), el('span', 'etiket', 'Sınav'));

function programCiz() {
  const L = gunGorevleri(sec);
  const dersler = veri.dersler.filter((x) => +x.gun === coz(sec).getDay());
  const satirlar = [];
  const satir = (etiket, ...ogeler) => {
    if (ogeler.length) {
      satirlar.push(el('div', 'saat-satir', null, el('span', null, etiket), el('ul', 'liste', null, ...ogeler)));
    }
  };

  satir('Gün boyu',
    ...veri.sinavlar.filter((x) => x.tarih === sec).map(sinavOgesi),
    ...L.filter((g) => !g.saat).map((g) => gorevSatiri(g, sec, false)));

  for (let s = 0; s < 24; s++) {
    const hh = String(s).padStart(2, '0');
    satir(hh + ':00',
      ...dersler.filter((x) => x.saat.slice(0, 2) === hh).map(dersOgesi),
      ...L.filter((g) => g.saat.slice(0, 2) === hh).map((g) => gorevSatiri(g, sec, false)));
  }
  if (!satirlar.length) satirlar.push(el('div', 'bos', 'Bu gün için programda bir şey yok.'));
  $('p-liste').replaceChildren(...satirlar);
}

// ---------- Dersler ve sınavlar ----------
function derslerCiz() {
  const siraliDers = [...veri.dersler].sort(
    (a, b) => ((+a.gun + 6) % 7) - ((+b.gun + 6) % 7) || a.saat.localeCompare(b.saat));
  doldur('d-liste', siraliDers, (x) =>
    el('li', 'oge ders', null, el('span', 'saat', `${GUNLER[x.gun]} ${x.saat}`), el('span', 'metin', x.ad), sil('dersler', x)),
    'Henüz ders eklenmedi.');

  const siraliSinav = [...veri.sinavlar].sort((a, b) => a.tarih.localeCompare(b.tarih));
  doldur('s-liste', siraliSinav, (x) => {
    const kalan = Math.round((coz(x.tarih) - coz(bugun())) / 864e5);
    const yazi = kalan > 0 ? `${kalan} gün kaldı` : kalan === 0 ? 'Bugün' : 'Geçti';
    return el('li', 'oge sinav', null,
      el('span', 'saat', bicim(x.tarih, { day: 'numeric', month: 'short' })),
      el('span', 'metin', x.ad), el('span', 'etiket', yazi), sil('sinavlar', x));
  }, 'Henüz sınav eklenmedi.');
}

// ---------- Notlar ----------
function notCiz() {
  const q = $('n-ara').value.trim().toLowerCase();
  const L = veri.notlar.filter((n) =>
    !q || n.metin.toLowerCase().includes(q) || n.etiketler.some((e) => e.toLowerCase().includes(q)));

  doldur('n-liste', L, (n) => {
    const p = el('p', 'n-metin', n.metin);
    p.contentEditable = 'true'; // tıklayıp doğrudan düzenle, dışına tıklayınca kaydolur
    p.title = 'Düzenlemek için tıkla';
    p.onblur = () => {
      const m = p.innerText.trim();
      if (m) { n.metin = m; kaydet(); } else p.textContent = n.metin;
    };

    const etiketler = n.etiketler.map((e) => {
      const b = el('button', 'etiket', '#' + e);
      b.onclick = () => { $('n-ara').value = e; notCiz(); };
      return b;
    });
    const alt = el('div', 'alt', null, ...etiketler, el('span', 'bosluk'),
      el('small', null, new Date(n.id).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })),
      sil('notlar', n));
    return el('li', 'oge not-kart', null, p, alt);
  }, 'Not bulunamadı.');
}

// ---------- Alışkanlıklar ve hedefler ----------
function seri(a) {
  let t = a.gunler.includes(sec) ? sec : gunEkle(sec, -1);
  let n = 0;
  while (a.gunler.includes(t)) { n++; t = gunEkle(t, -1); }
  return n;
}

function aliskCiz() {
  $('al-baslik').textContent = 'Seçili gün: ' + bicim(sec, { weekday: 'long', day: 'numeric', month: 'long' });

  doldur('al-liste', veri.aliskanliklar, (a) => {
    const k = el('input');
    k.type = 'checkbox';
    k.checked = a.gunler.includes(sec);
    k.setAttribute('aria-label', a.ad + ' yapıldı');
    k.onchange = () => {
      a.gunler = k.checked ? [...a.gunler, sec] : a.gunler.filter((x) => x !== sec);
      degisti();
    };
    return el('li', 'oge', null, k, el('span', 'metin', a.ad), el('span', 'etiket', seri(a) + ' gün seri'), sil('aliskanliklar', a));
  }, 'Henüz alışkanlık eklenmedi.');

  doldur('hd-liste', veri.hedefler, (h) => {
    const r = el('input');
    r.type = 'range'; r.min = 0; r.max = 100; r.step = 5; r.value = h.yuzde;
    r.setAttribute('aria-label', h.ad + ' ilerlemesi');
    const y = el('span', 'etiket', '%' + h.yuzde);
    r.oninput = () => { y.textContent = '%' + r.value; };
    r.onchange = () => { h.yuzde = +r.value; kaydet(); };
    return el('li', 'oge', null, el('span', 'metin', h.ad), r, y, sil('hedefler', h));
  }, 'Henüz hedef eklenmedi.');
}

// ---------- Hepsini çiz ----------
function ciz() {
  gunCiz(); ilerlemeCiz(); haftaCiz(); ayCiz(); programCiz(); derslerCiz(); notCiz(); aliskCiz(); gelisimCiz();
}

// ---------- Sekmeler ve gezinme ----------
const sekmeler = document.querySelectorAll('.tab');
const paneller = document.querySelectorAll('.panel');
sekmeler.forEach((s) => {
  s.onclick = () => {
    sekmeler.forEach((x) => x.classList.toggle('active', x === s));
    paneller.forEach((p) => p.classList.toggle('active', p.id === s.dataset.target));
  };
});
const sekmeAc = (id) => document.querySelector(`[data-target="${id}"]`).click();

// Her görünümün üstündeki ‹ › Bugün düğmeleri
document.querySelectorAll('.nav').forEach((nav) => {
  nav.addEventListener('click', (e) => {
    const f = e.target.dataset.f;
    if (f === undefined) return;
    const k = +f;
    const tur = nav.dataset.nav;
    if (k === 0) sec = bugun();
    else if (tur === 'hafta') sec = gunEkle(sec, 7 * k);
    else if (tur === 'ay') { const d = coz(sec); d.setMonth(d.getMonth() + k, 1); sec = yaz(d); }
    else sec = gunEkle(sec, k);
    ciz();
  });
});

// ---------- Formlar ----------
function formKur(id, fn) {
  $(id).onsubmit = (e) => {
    e.preventDefault();
    fn();
    e.target.reset();
    degisti();
  };
}

formKur('gf', () => {
  const metin = $('g-metin').value.trim();
  if (!metin) return;
  veri.gorevler.push({
    id: Date.now(), metin, tarih: sec, saat: $('g-saat').value,
    oncelik: $('g-onc').value, kategori: $('g-kat').value, tekrar: $('g-tekrar').value, biten: [],
  });
});
formKur('df', () => veri.dersler.push({ id: Date.now(), ad: $('d-ad').value.trim(), gun: $('d-gun').value, saat: $('d-saat').value }));
formKur('sf', () => veri.sinavlar.push({ id: Date.now(), ad: $('s-ad').value.trim(), tarih: $('s-tarih').value }));
formKur('nf', () => {
  const metin = $('n-metin').value.trim();
  if (!metin) return;
  const etiketler = $('n-etiket').value.split(',').map((e) => e.trim().replace(/^#/, '')).filter(Boolean);
  veri.notlar.unshift({ id: Date.now(), metin, etiketler });
});
formKur('af', () => veri.aliskanliklar.push({ id: Date.now(), ad: $('al-ad').value.trim(), gunler: [] }));
formKur('hdf', () => veri.hedefler.push({ id: Date.now(), ad: $('hd-ad').value.trim(), yuzde: 0 }));
$('n-ara').oninput = notCiz;

// ---------- Karanlık mod ----------
function temaUygula(t) {
  document.documentElement.dataset.tema = t;
  $('tema').textContent = t === 'koyu' ? 'Açık mod' : 'Karanlık mod';
  localStorage.setItem('tema', t);
}
temaUygula(localStorage.getItem('tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'koyu' : 'acik'));
$('tema').onclick = () => temaUygula(document.documentElement.dataset.tema === 'koyu' ? 'acik' : 'koyu');

// ---------- Yedekleme ----------
$('yedekle').onclick = () => {
  const a = el('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' }));
  a.download = `planlayici-yedek-${bugun()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('yukle').onclick = () => $('dosya').click();
$('dosya').onchange = async (e) => {
  const dosya = e.target.files[0];
  if (!dosya) return;
  try {
    const y = JSON.parse(await dosya.text());
    if (!confirm('Mevcut verilerin yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return;
    ANAHTARLAR.forEach((k) => (veri[k] = Array.isArray(y[k]) ? y[k] : []));
    duzenle();
    degisti();
  } catch {
    alert('Dosya okunamadı. Planlayıcıdan aldığın bir yedek dosyası seçtiğinden emin ol.');
  } finally {
    e.target.value = '';
  }
};
// ---------- Günün sözü ----------
const SOZLER = [
  'Bugün attığın küçük adım, yarınki büyük farkın başlangıcıdır.',
  'Mükemmel olmak zorunda değilsin; başlamak ve devam etmek yeterli.',
  'Yazdığın her satır kod, hayalindeki hayata eklenen bir tuğladır.',
  'Yorulursan dinlen, ama vazgeçme.',
  'Disiplin, motivasyonun bittiği yerde devreye giren sözündür.',
  'Bugünkü emeğin, gelecekteki özgürlüğündür.',
  'Küçük ilerleme de ilerlemedir. Devam et.',
  'Kendini dünle değil, bir yıl önceki haline göre kıyasla.',
  'Zor günde bile tamamladığın tek görev seni hedefe yaklaştırır.',
  'Beceriler tekrarla büyür; sen de her gün biraz daha güçleniyorsun.',
  'Bugün çalışmaya oturman, geleceğine yaptığın bir yatırımdır.',
  'Hayalin büyükse bugünkü küçük görevler bile önemlidir.',
];
function sozCiz() {
  $('soz').textContent = SOZLER[Math.floor(Date.now() / 864e5) % SOZLER.length];
}

// ---------- İlerleme halkası ----------
function ilerlemeCiz() {
  const L = gunGorevleri(sec);
  const n = L.filter((g) => g.biten.includes(sec)).length;
  const y = L.length ? Math.round((n * 100) / L.length) : 0;
  $('halka').style.setProperty('--p', y);
  $('halka-yuzde').textContent = y + '%';
  $('ilerleme-baslik').textContent = L.length ? `${n}/${L.length} görev tamamlandı` : 'Bu gün için görev yok';
  $('ilerleme-alt').textContent = !L.length ? 'Küçük bir hedefle güne başla.'
    : y === 100 ? 'Günü tamamladın, kendinle gurur duy!'
    : y >= 50 ? 'Yarıyı geçtin, devam et.'
    : 'Bir görevle başla, gerisi gelir.';
}

// ---------- Gelişim ----------
function gelisimCiz() {
  const tamam = veri.gorevler.reduce((t, g) => t + g.biten.length, 0);
  const enSeri = Math.max(0, ...veri.aliskanliklar.map(seri));
  const hedefOrt = veri.hedefler.length
    ? Math.round(veri.hedefler.reduce((t, h) => t + h.yuzde, 0) / veri.hedefler.length) : 0;
  const kazanimGun = new Set(veri.kazanimlar.map((k) => k.tarih)).size;
  const kart = (sayi, ad) => el('div', 'istat-kart', null, el('strong', null, String(sayi)), el('span', null, ad));
  $('istat').replaceChildren(
    kart(tamam, 'tamamlanan görev'), kart(enSeri, 'günlük alışkanlık serisi'),
    kart('%' + hedefOrt, 'hedef ilerlemesi'), kart(kazanimGun, 'gün kazanım yazdın'));

  doldur('v-liste', veri.vizyon, (v) =>
    el('li', 'v-kart', null, el('small', null, v.sure), el('p', null, v.metin), sil('vizyon', v)),
    'Henüz vizyon yok. İlk hayalini yaz.');

  const son = [...veri.kazanimlar].sort((a, b) => b.id - a.id).slice(0, 10);
  doldur('k-liste', son, (k) =>
    el('li', 'oge', null, el('span', 'saat', bicim(k.tarih, { day: 'numeric', month: 'short' })),
      el('span', 'metin', k.metin), sil('kazanimlar', k)),
    'Henüz kazanım yok.');
}
formKur('vf', () => veri.vizyon.push({ id: Date.now(), metin: $('v-metin').value.trim(), sure: $('v-sure').value }));
formKur('kf', () => veri.kazanimlar.push({ id: Date.now(), metin: $('k-metin').value.trim(), tarih: bugun() }));
sozCiz();
// ---------- Başlat ----------
duzenle();
ciz();