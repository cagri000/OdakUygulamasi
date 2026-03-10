import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, TextInput, Alert, Platform, AppState } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import KategoriSecici from '@/components/KategoriSecici';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import IstatistikModal from '@/components/IstatistikModal';
import { Audio } from 'expo-av';
import BilgiModal from '@/components/BilgiModal';

export default function App() {
  // --- HAFIZA (STATE) ---
  const [saniye, setSaniye] = useState(0); 
  const [calisiyorMu, setCalisiyorMu] = useState(false); 
  const [secilenKategori, setSecilenKategori] = useState('Odak'); 
  const [otomatikMod, setOtomatikMod] = useState(false); 
  const [kategoriler, setKategoriler] = useState([
    { id: '1', ad: 'Odak', ikon: '🎯', renk: '#FF453A' },
  ]);
  const [modalAcikMi, setModalAcikMi] = useState(false);
  const [yeniKategoriAdi, setYeniKategoriAdi] = useState('');
  const [yeniKategoriIkon, setYeniKategoriIkon] = useState('📌'); // Varsayılan ikon
  const aktifKategoriObjesi = kategoriler.find((k) => k.ad === secilenKategori);
  const aktifRenk = aktifKategoriObjesi ? aktifKategoriObjesi.renk : '#34C759';
  const [istatistikler, setIstatistikler] = useState<any>({});
  const [istatistikModalAcikMi, setIstatistikModalAcikMi] = useState(false); 
  const [sesAcikMi, setSesAcikMi] = useState(false);
  const [secilenSes, setSecilenSes] = useState('yagmur'); 
  const [sesModalAcikMi, setSesModalAcikMi] = useState(false); 
  const sesMotoru = useRef<Audio.Sound | null>(null);
  const arkaPlanZamani = useRef<number | null>(null); 
  const calisiyorMuRef = useRef(calisiyorMu);
  const [bilgiModalAcikMi, setBilgiModalAcikMi] = useState(false);

  // --- SES DOSYALARI HARİTASI ---
  // (Eğer dosyalarının adı veya uzantısı farklıysa burayı ona göre güncelle)
  const SESLER: any = {
    'yagmur': require('../../assets/yagmur.mp3'),
    'kafe': require('../../assets/kafe.mp3'),
    'orman': require('../../assets/orman.mp3'),
  };

  
  useEffect(() => {
    const kayitliVerileriGetir = async () => {
      try {
        // Sabit diskten '@kategoriler_kutusu' adlı paketi oku
        const kayitliPaket = await AsyncStorage.getItem('@kategoriler_kutusu');

        if (kayitliPaket !== null) {
          // Eğer paket boş değilse, içindeki yazıyı (String) tekrar Array formatına (JSON.parse) çevir ve state'e yaz!
          setKategoriler(JSON.parse(kayitliPaket));
        }
        // 2. İstatistikleri (Kumbarayı) getir
        const kayitliIstatistik = await AsyncStorage.getItem('@zaman_kumbarasi');
        if (kayitliIstatistik !== null) {
          setIstatistikler(JSON.parse(kayitliIstatistik));
        }
      } catch (error) {
        console.error("Veriler yüklenirken hata oldu:", error);
      }
    };

    kayitliVerileriGetir();
  }, []); 


  // --- ZAMANLAYICI MOTORU (SİHİRLİ KISIM) ---
  useEffect(() => {
    let interval: any = null; // Sayacın kumandası

    if (calisiyorMu) {
      // Eğer sistem "Çalışıyor" modundaysa, her 1000 milisaniyede (1 saniye) bir içerdeki işlemi yap.
      interval = setInterval(() => {
        setSaniye((mevcutSaniye) => mevcutSaniye + 1);
      }, 1000);
    } else {
      // Eğer sistem durdurulduysa, sayacı (interval) iptal et ki arka planda boşuna çalışmasın.
      clearInterval(interval);
    }

 
    return () => clearInterval(interval);

  }, [calisiyorMu]); 


  useEffect(() => {
    const sesYonetimi = async () => {
      // 1. GÜVENLİK KONTROLÜ: İçeride eski bir ses varsa, ÖNCE onun yüklendiğinden emin ol, sonra sil!
      if (sesMotoru.current) {
        const durum = await sesMotoru.current.getStatusAsync();
        if (durum.isLoaded) {
          await sesMotoru.current.stopAsync();
          await sesMotoru.current.unloadAsync();
        }
        sesMotoru.current = null; // Donanımı boşa çıkar
      }

      // 2. ÇALMA KONTROLÜ: Sayaç çalışıyorsa ve Kulaklık açıksa YENİ sesi yükle
      if (calisiyorMu && sesAcikMi) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            SESLER[secilenSes],
            { isLooping: true, volume: 0.5 }
          );

          sesMotoru.current = sound; // Yeni sesi motora bağla
          await sound.playAsync(); // Ve oynat!
        } catch (error) {
          console.log("Ses çalınamadı:", error);
        }
      }
    };

    sesYonetimi();

    // 3. ÇÖPÇÜ (Temizlik): Kullanıcı uygulamayı aniden kapatırsa sesi arkada bırakma
    return () => {
      if (sesMotoru.current) {
        sesMotoru.current.unloadAsync();
      }
    };
  }, [calisiyorMu, sesAcikMi, secilenSes]);


  // --- DONANIM SENSÖRÜ (GÖRÜNMEZ NÖBETÇİ) ---
  useEffect(() => {
    // 1. KURAL: Eğer sistem "Otomatik (Sensör)" modunda DEĞİLSE, sensörü hiç uyandırma!
    if (!otomatikMod) {
      return;
    }

    Accelerometer.setUpdateInterval(500);

    // 2. Telefonun 3D uzaydaki konumunu (x, y, z eksenleri) dinlemeye başla
    const abonelik = Accelerometer.addListener((veri) => {
      const zEkseni = veri.z;

      // Z ekseni -0.8'den küçükse = Telefon ters (yüzüstü) duruyor demektir!
      if (zEkseni < -0.8 && !calisiyorMu) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // YENİ: Başarı titreşimi!
        setCalisiyorMu(true); // Sayacı BAŞLAT!
      }
      // Z ekseni +0.8'den büyükse = Telefon düz (ekran yukarı) duruyor demektir!
      else if (zEkseni > 0.8 && calisiyorMu) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // YENİ: Masaya koyma tıkı!
        setCalisiyorMu(false); // Sayacı DURDUR!
      }
    });

    // 3. CLEANUP (Temizlik): Uygulama kapanırsa sensörü kapat ki telefonun şarjı bitmesin!
    return () => abonelik.remove();

  }, [calisiyorMu, otomatikMod]); 

  useEffect(() => {
    calisiyorMuRef.current = calisiyorMu;
  }, [calisiyorMu]);


  // --- 2. KURŞUNGEÇİRMEZ ZAMAN MAKİNESİ (APPSTATE) ---
  useEffect(() => {
    const abonelik = AppState.addEventListener('change', (yeniDurum) => {

      if (yeniDurum === 'active') {
        // UYGULAMA GERİ GELDİ!
        // DİKKAT: Burada state (calisiyorMu) değil, anlık ref (calisiyorMuRef.current) kullanıyoruz!
        if (calisiyorMuRef.current && arkaPlanZamani.current) {
          const farkMilisaniye = Date.now() - arkaPlanZamani.current;
          const eklenecekSaniye = Math.floor(farkMilisaniye / 1000);

          if (eklenecekSaniye > 0) {
            setSaniye((eskiSaniye) => eskiSaniye + eklenecekSaniye);
          }
        }
        arkaPlanZamani.current = null; // Not defterini temizle
      }
      else if (yeniDurum === 'background' || yeniDurum === 'inactive') {
        // UYGULAMA AŞAĞI İNDİRİLDİ!
        if (calisiyorMuRef.current) {
          arkaPlanZamani.current = Date.now(); // O anki saati milisaniyesiyle çak!
        }
      }
    });

    return () => {
      abonelik.remove();
    };
  }, []); 

  // --- BUTON FONKSİYONLARI ---
  const baslatDurdur = () => {
    if (calisiyorMu) {
      // Durdururken hafif bir 'tık' hissi
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Başlatırken tok ve kararlı bir his
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCalisiyorMu(!calisiyorMu); 
  };

  const sifirla = () => {
    // Sıfırlama işleminde 'Uyarı/Hata' tarzı çift titreme
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    // YENİ: Süreyi sıfırlamadan hemen önce kumbaraya at!
    sureyiKumbarayaEkle(saniye, secilenKategori);

    setCalisiyorMu(false); // Önce motoru durdur
    setSaniye(0); // Sonra sayacı sıfırla
  };

  // --- ZAMAN KUMBARASI (MUHASEBECİ) MOTORU ---
  const sureyiKumbarayaEkle = (kaydedilecekSaniye: number, kategoriAd: string) => {
    // Eğer saniye 0 ise boşuna diski yorma, hiçbir şey yapma!
    if (kaydedilecekSaniye === 0) return;

    // 1. Mevcut kumbaranın kopyasını al
    const yeniKumbara = { ...istatistikler };

    // 2. Eski sürenin üzerine yenisini ekle (Eğer daha önce o kategori yoksa 0 kabul et)
    yeniKumbara[kategoriAd] = (yeniKumbara[kategoriAd] || 0) + kaydedilecekSaniye;

    // 3. Ekrana (State) ve Sabit Diske (AsyncStorage) anında yaz!
    setIstatistikler(yeniKumbara);
    AsyncStorage.setItem('@zaman_kumbarasi', JSON.stringify(yeniKumbara));
  };

  // --- YENİ KATEGORİ EKLEME MOTORU ---
  const yeniKategoriKaydet = () => {
    // 1. Güvenlik Kontrolü: İsim boş mu girilmiş?
    if (yeniKategoriAdi.trim() === '') {
      alert('Lütfen bir kategori adı girin!');
      return; // Boşsa işlemi iptal et
    }

   
    const renkHavuzu = ['#FFD60A', '#FF9F0A', '#5E5CE6', '#32ADE6', '#34C759', '#FF453A', '#BF5AF2'];
    const rastgeleRenk = renkHavuzu[Math.floor(Math.random() * renkHavuzu.length)];

    // 3. Yeni Paketi Hazırla
    const yeniKategoriObjesi = {
      id: Date.now().toString(), // Benzersiz (Unique) kimlik oluştur
      ad: yeniKategoriAdi,
      ikon: yeniKategoriIkon || '📌', // İkon boşsa varsayılan raptiye koy
      renk: rastgeleRenk,
    };

    // 4. State'i Güncelle ve Sabit Diske (AsyncStorage) YAZ!
    const guncelListe = [...kategoriler, yeniKategoriObjesi];
    setKategoriler(guncelListe);
    setSecilenKategori(yeniKategoriObjesi.ad);

    // YENİ EKLENEN KISIM: Veriyi string'e (yazıya) çevirip diske kaydediyoruz
    AsyncStorage.setItem('@kategoriler_kutusu', JSON.stringify(guncelListe));

    // 5. Ortalığı Temizle ve Perdeyi Kapat
    setYeniKategoriAdi('');
    setYeniKategoriIkon('📌');
    setModalAcikMi(false);
  };

  // --- KATEGORİ SİLME MOTORU ---
  const kategoriSil = (silinecekId: string, silinecekAd: string) => {
    // 1. Güvenlik Duvarı: Ekranda tek bir kategori kaldıysa silmesine izin verme! (Uygulama çöker)
    if (kategoriler.length === 1) {
      Alert.alert("Hata", "En az 1 kategori kalmak zorundadır!");
      return;
    }

    // 2. Kullanıcıya "Emin misin?" diye sor (Yanlışlıkla basılı tutmuş olabilir)
    Alert.alert(
      "Kategoriyi Sil", // Başlık
      `"${silinecekAd}" kategorisini silmek istediğine emin misin?`, // Mesaj
      [
        { text: "İptal", style: "cancel" }, // Vazgeç butonu
        {
          text: "Sil",
          style: "destructive", // iOS'te yazıyı kırmızı yapar (Tehlike belirtir)
          onPress: () => {
            // 3. Gerçek Silme İşlemi (Filter Algoritması)
            // Kural: ID'si silinecek ID'ye EŞİT OLMAYANLARI tut, diğerini çöpe at!
            const yeniListe = kategoriler.filter((kategori) => kategori.id !== silinecekId);
            setKategoriler(yeniListe);

            // YENİ EKLENEN KISIM: Silinmiş (güncel) listeyi diske yaz ki kalıcı olarak silinsin
            AsyncStorage.setItem('@kategoriler_kutusu', JSON.stringify(yeniListe));

            // 4. Kritik UX Detayı: Eğer sildiğimiz kategori şu an "Seçili" olansa, seçimi boşta bırakma!
            // Geriye kalan listenin ilk elemanını otomatik olarak seçili yap.
            if (secilenKategori === silinecekAd) {
              setSecilenKategori(yeniListe[0].ad);
            }
          }
        }
      ]
    );
  };

  // --- KATEGORİ DEĞİŞTİRME NÖBETÇİSİ (GUARD CLAUSE) ---
  const kategoriDegistir = (yeniKategoriAd: string) => {
    // 1. Kural: Eğer tıklanan kategori zaten şu an seçili olansa, hiçbir şey yapma (Boşuna yorulma)
    if (secilenKategori === yeniKategoriAd) return;

    // 2. Kural: Eğer sayaç ÇALIŞIYORSA, kullanıcıyı uyar!
    if (calisiyorMu || saniye > 0) { // DİKKAT: Sadece çalışıyorsa değil, duraklatılmış ama içinde süre varsa da uyar!
      Alert.alert(
        "Sayaç Devam Ediyor!",
        "Şu an aktif bir sayacınız var. Diğer kategoriye geçerseniz sayacınız kaydedilip sıfırlanacaktır. Emin misiniz?",
        [
          { text: "Vazgeç", style: "cancel" }, // Kullanıcı vazgeçerse hiçbir şey yapma, sayaç akmaya devam etsin
          {
            text: "Kaydet ve Geç",
            style: "destructive", // Kırmızı tehlike butonu
            onPress: () => {
              // YENİ: Önce kumbaraya at, sonra sıfırla ve geç!
              sureyiKumbarayaEkle(saniye, secilenKategori);
              setCalisiyorMu(false);
              setSaniye(0);
              setSecilenKategori(yeniKategoriAd);
            }
          }
        ]
      );
    } else {
      // 3. Kural: Sayaç çalışmıyorsa (0'da duruyorsa veya duraklatılmışsa) direkt geçiş yap.
      Haptics.selectionAsync(); // YENİ: Çok hafif menü seçim titreşimi
      setSecilenKategori(yeniKategoriAd);
    }
  };

  // --- ZAMAN ÇEVİRMENİ (FORMATTER) ---
  const zamaniFormatla = (toplamSaniye: number) => {
    // 1. DAKİKA: Toplam saniyeyi 60'a böl ve küsuratı çöpe at (Math.floor)
    // Örn: 125 / 60 = 2.08 -> Math.floor(2.08) = 2
    const dakika = Math.floor(toplamSaniye / 60);

    // 2. SANİYE: Toplam saniyenin 60'a bölümünden kalanı bul (Mod alma: %)
    // Örn: 125 % 60 = 5
    const kalanSaniye = toplamSaniye % 60;

    // 3. VİTRİN SÜSLEMESİ (Çok Kritik!)
    // Eğer sayı 10'dan küçükse (örn: 5), başına '0' ekle ki "2:5" değil "02:05" görünsün.
    // .padStart(2, '0') demek: "Bu yazıyı 2 haneli yap, eksikse başını '0' ile doldur" demektir.
    const formatliDakika = dakika.toString().padStart(2, '0');
    const formatliSaniye = kalanSaniye.toString().padStart(2, '0');

    return `${formatliDakika}:${formatliSaniye}`;
  };

  return (
    <View style={styles.container}>
      {/* --- ÜST BAŞLIK VE İKONLAR (MODERN SOLA YASLI TASARIM) --- */}
    <View style={{ position: 'absolute', top: 65, width: '90%', flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>

        {/* SOL: BÜYÜK BAŞLIK */}
        <Text style={[styles.baslik, { marginBottom: 0, textAlign: 'left', flex: 1 }]}>
          FocusFlow
        </Text>

        {/* SAĞ: TÜM KONTROL İKONLARI (Bilgi, Kulaklık, İstatistik) */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          
          <TouchableOpacity 
            style={styles.istatistikButon} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setBilgiModalAcikMi(true);
            }}
          >
            <Text style={{ fontSize: 20 }}>ℹ️</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.istatistikButon, { borderColor: sesAcikMi ? '#34C759' : '#3A3A3C' }]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSesAcikMi(!sesAcikMi); 
            }}
            onLongPress={() => {
              Haptics.selectionAsync();
              setSesModalAcikMi(true); 
            }}
          >
            <Text style={{ fontSize: 20 }}>{sesAcikMi ? '🎧' : '🔇'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.istatistikButon} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIstatistikModalAcikMi(true);
            }}
          >
            <Text style={{ fontSize: 20 }}>📊</Text>
          </TouchableOpacity>

        </View>
      </View>

      {/* --- DAİRESEL İLERLEME ÇUBUĞU (CIRCULAR PROGRESS) --- */}
      <View style={styles.cemberKutusu}>
        <Svg width="300" height="300">
          {/* 1. ARKA PLAN HALKASI (Sönük Gri) */}
          <Circle
            cx="150" cy="150" r="120"
            stroke="#3A3A3C" strokeWidth="15" fill="none"
          />

          {/* 2. DOLAN HALKA (Canlı Yeşil) */}
          <Circle
            cx="150" cy="150" r="120"
            stroke={aktifRenk} strokeWidth="15" fill="none"
            strokeLinecap="round" // Çizginin uçları yumuşak (yuvarlak) olsun
            strokeDasharray={2 * Math.PI * 120} // Çemberin tam çevresi (Matematik: 2 * pi * r)
            strokeDashoffset={(2 * Math.PI * 120) - ((2 * Math.PI * 120) * ((saniye % 60) / 60))} // Doluluk oranı
            rotation="-90" // Çizim saat 3 yönünden değil, saat 12 (en üst) yönünden başlasın
            originX="150" originY="150" // <--- DİKKAT: Burayı değiştirdik!
          />
        </Svg>

        {/* --- YAZIYI ÇEMBERİN TAM ORTASINA OTURTMA --- */}
        <View style={styles.merkezYaziKutusu}>
          <Text style={styles.sayacMetni}>{zamaniFormatla(saniye)}</Text>
        </View>
      </View>

      {/* --- KATEGORİ VİTRİNİ (DIŞARIDAN GELDİ) --- */}
      <KategoriSecici
        secilen={secilenKategori}
        setSecilen={kategoriDegistir} // DİKKAT: Artık düz state'i değil, Nöbetçi motorumuzu (kategoriDegistir) bağladık!
        kategoriler={kategoriler} // Dinamik state'i içeri gönderdik
        yeniEkleBasildi={() => setModalAcikMi(true)} // Artı butonuna basılınca Modal'ı aç!
        kategoriSil={kategoriSil}
      />
      {/* --- MOD SEÇİCİ ŞALTER --- */}
      <View style={styles.modKutusu}>
        <TouchableOpacity
          style={[styles.modButonu, !otomatikMod && styles.modAktif]}
          onPress={() => setOtomatikMod(false)}
        >
          <Text style={[styles.modYazi, !otomatikMod && styles.modYaziAktif]}>✋ Manuel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modButonu, otomatikMod && styles.modAktif]}
          onPress={() => setOtomatikMod(true)}
        >
          <Text style={[styles.modYazi, otomatikMod && styles.modYaziAktif]}>📴 Ters Çevir</Text>
        </TouchableOpacity>
      </View>

      {/* --- KONTROL BUTONLARI --- */}
      <View style={styles.butonKutusu}>
        <TouchableOpacity
          style={[
            styles.buton,
            // DİKKAT: Butonun arka plan rengini dinamik olarak veriyoruz!
            // Çalışıyorsa (Durdur butonuysa) hep kırmızı (#FF3B30) olsun ki tehlike hissi versin.
            // Ama duruyorsa (Başlat butonuysa) kategorinin kendi rengi olsun!
            { backgroundColor: calisiyorMu ? '#FF3B30' : aktifRenk }
          ]}
          onPress={baslatDurdur}
        >
          <Text style={styles.butonYazi}>
            {calisiyorMu ? 'DURDUR' : 'BAŞLAT'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sifirlaButon} onPress={sifirla}>
          <Text style={styles.butonYazi}>SIFIRLA</Text>
        </TouchableOpacity>
      </View>

      {/* --- YENİ KATEGORİ EKLEME PENCERESİ (MODAL) --- */}
      <Modal visible={modalAcikMi} animationType="slide" transparent={true}>
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutusu}>
            <Text style={styles.modalBaslik}>Yeni Kategori Yarat</Text>

            <TextInput
              style={styles.inputKutusu}
              placeholder="Kategori Adı (Örn: Spor)"
              placeholderTextColor="#8E8E93"
              value={yeniKategoriAdi}
              onChangeText={setYeniKategoriAdi}
            />

            <TextInput
              style={styles.inputKutusu}
              placeholder="Bir İkon Seç (Örn: 🏃‍♂️)"
              placeholderTextColor="#8E8E93"
              value={yeniKategoriIkon}
              onChangeText={setYeniKategoriIkon}
              maxLength={2} // Sadece 1 emoji sığsın
            />

            <View style={styles.modalButonKutusu}>
              <TouchableOpacity
                style={styles.vazgecButon}
                onPress={() => setModalAcikMi(false)}
              >
                <Text style={styles.vazgecYazi}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.kaydetButon}
                onPress={yeniKategoriKaydet}
              >
                <Text style={styles.kaydetYazi}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- İSTATİSTİKLER PENCERESİ (DIŞARIDAN GELDİ) --- */}
      <IstatistikModal
        acikMi={istatistikModalAcikMi}
        kapat={() => setIstatistikModalAcikMi(false)}
        istatistikler={istatistikler}
        kategoriler={kategoriler}
        zamaniFormatla={zamaniFormatla}
        verileriSifirla={() => {
          setIstatistikler({});
          AsyncStorage.removeItem('@zaman_kumbarasi');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* --- SES SEÇİM PENCERESİ (MODAL) --- */}
      <Modal visible={sesModalAcikMi} animationType="slide" transparent={true}>
        <View style={styles.modalArkaPlan}>
          <View style={[styles.modalKutusu, { paddingBottom: 10 }]}>

            <View style={styles.modalBaslikKutusu}>
              <Text style={styles.modalBaslik}>Odak Sesi Seç 🎧</Text>
              <TouchableOpacity style={styles.kapatIkonu} onPress={() => setSesModalAcikMi(false)}>
                <Text style={styles.kapatIkonuYazi}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Seçenekler */}
            {['yagmur', 'kafe', 'orman'].map((sesAdi) => (
              <TouchableOpacity
                key={sesAdi}
                style={[
                  styles.istatistikSatir,
                  { width: '100%', paddingHorizontal: 10 },
                  secilenSes === sesAdi ? { backgroundColor: '#2C2C2E', borderRadius: 10 } : null
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSecilenSes(sesAdi); // Sesi değiştir
                  setSesAcikMi(true); // Sesi otomatik aç
                  setSesModalAcikMi(false); // Menüyü kapat
                }}
              >
                <Text style={styles.istatistikKategoriAd}>
                  {sesAdi === 'yagmur' ? '🌧️ Yağmur Sesi' : sesAdi === 'kafe' ? '☕ Kafe Uğultusu' : '🌲 Orman Huzuru'}
                </Text>
                {secilenSes === sesAdi && <Text style={{ color: '#34C759', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      {/* --- BİLGİ PENCERESİ (DIŞARIDAN GELDİ) --- */}
      <BilgiModal
        acikMi={bilgiModalAcikMi}
        kapat={() => setBilgiModalAcikMi(false)}
      />


    </View>
  );
}

// --- İSKELET TASARIMI (UI) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Göz yormayan koyu tema (Dark Mode)
    alignItems: 'center',
    justifyContent: 'center',
  },
  baslik: {
    color: '#8E8E93',
    fontSize: 24,
    marginBottom: 20,
  },
  butonKutusu: {
    flexDirection: 'row',
    gap: 20, // Butonlar arası boşluk
  },
  buton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  sifirlaButon: {
    backgroundColor: '#3A3A3C', // Koyu Gri
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  butonYazi: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // ... diğer stiller (baslik, container vs duruyor)

  cemberKutusu: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  merkezYaziKutusu: {
    position: 'absolute', // Svg'nin üzerine "Havadan" yerleştir demek
    alignItems: 'center',
    justifyContent: 'center',
  },
  sayacMetni: {
    color: 'white',
    fontSize: 65, // Çembere sığması için biraz küçülttük
    fontWeight: 'bold',
  },
  modKutusu: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E', // Koyu gri arka plan
    borderRadius: 25,
    padding: 4,
    marginBottom: 30, // Alttaki butonlarla arasını açalım
    width: '80%', // Ekranın %80'ini kaplasın
  },
  modButonu: {
    flex: 1, // İki buton da eşit yer kaplasın
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  modAktif: {
    backgroundColor: '#3A3A3C', // Seçili olan butonun arka planı hafif aydınlansın
  },
  modYazi: {
    color: '#8E8E93', // Seçili olmayan yazı sönük gri
    fontSize: 15,
    fontWeight: '600',
  },
  modYaziAktif: {
    color: 'white', // Seçili olan yazı parlasın
  },
  modalArkaPlan: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Arka planı %70 karart
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKutusu: {
    width: '85%',
    backgroundColor: '#1C1C1E',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  modalBaslik: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputKutusu: {
    backgroundColor: '#2C2C2E',
    color: 'white',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButonKutusu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  vazgecButon: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: '#3A3A3C',
    marginRight: 10,
    alignItems: 'center',
  },
  kaydetButon: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: '#34C759',
    marginLeft: 10,
    alignItems: 'center',
  },
  vazgecYazi: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  kaydetYazi: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  ustGrup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '85%',
    marginTop: 50, // StatusBar'ın altına çekelim
    marginBottom: 20,
  },
  istatistikButon: {
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },

  renkNoktasi: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  istatistikKategoriAd: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  istatistikSure: {
    color: '#34C759', 
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Sayılar hizada dursun
    fontWeight: 'bold',
  },


  kapatIkonuYazi: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? -2 : 0, // İkonun tam ortalanması için minik ayar
  },
  modalBaslikKutusu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  kapatIkonu: {
    backgroundColor: '#2C2C2E',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  istatistikSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
});
