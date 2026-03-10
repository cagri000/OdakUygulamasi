# ⏳ FocusFlow 

> Dış dünyadan soyutlanıp derin çalışmaya (Deep Work) odaklanmak isteyenler için tasarlanmış, minimalist ve "Immersive" (tam ekran) bir zaman yönetimi uygulaması.

İlk mobil uygulama projem olarak geliştirdiğim FocusFlow; sadeliği, performansı ve kullanıcı deneyimini (UX) ön planda tutarak tasarlandı.

## ✨ Temel Özellikler (Core Features)

* **🎯 Özelleştirilebilir Odak Sayacı:** Esnek zamanlayıcı ile kendi çalışma döngünü (Flow State) oluştur.
* **🎧 Ambiyans Sesleri (Ambient Audio):** Yağmur, Kafe ve Orman gibi arka plan sesleriyle çevresel dikkat dağıtıcıları engelle.
* **📱 Akıllı Dokunuşlar (Haptic Feedback):** Gizli menüler ve butonlar, kullanıcının eylemlerine fiziksel titreşimlerle (Haptics) tepki verir. Uzun basma (Long Press) gibi "Hidden Affordance" dinamikleri içerir.
* **📊 Cihaz İçi İstatistik (Local Storage):** Çalışma verilerin `AsyncStorage` ile tamamen senin cihazında (çevrimdışı ve güvenli) tutulur. İnternet gerektirmez, veri sızdırmaz.


## 🛠️ Kullanılan Teknolojiler (Tech Stack)

* **Framework:** React Native & Expo
* **Dil:** TypeScript / JavaScript (ES6+)
* **Bileşen Mimarisi:** React Functional Components & Hooks (`useState`, `useEffect`)
* **Kütüphaneler:** `expo-av` (Ses yönetimi), `expo-haptics` (Titreşim), `react-native-async-storage` (Yerel Veritabanı)
* **Derleme & Dağıtım (CI/CD):** EAS (Expo Application Services) ile Cloud Build (.apk)

## 🚀 Projeyi Kendi Bilgisayarında Çalıştırmak İçin

Projeyi kendi ortamında test etmek istersen şu adımları izleyebilirsin:

1. Repoyu bilgisayarına klonla:
   ```bash
   git clone https://github.com/cagri000/OdakUygulamasi.git

   2. Gerekli paketleri yükle:
   npm install

   3. Expo sunucusunu başlat:
   npx expo start
