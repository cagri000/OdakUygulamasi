import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

// --- DIŞARIDAN GELECEK KABLOLAR (PROPS) ---
interface Props {
  acikMi: boolean; // Pencere görünsün mü?
  kapat: () => void; // Çarpıya basılınca çalışacak komut
  istatistikler: any; // Gösterilecek veriler
  kategoriler: any[]; // Renkleri bulmak için kategori listesi
  zamaniFormatla: (saniye: number) => string; // Saniyeyi "00:00" yapan çevirmen
  verileriSifirla: () => void; // Basılı tutunca tüm verileri silecek komut
}

export default function IstatistikModal({ 
  acikMi, kapat, istatistikler, kategoriler, zamaniFormatla, verileriSifirla 
}: Props) {
  
  return (
    <Modal visible={acikMi} animationType="fade" transparent={true}>
      <View style={styles.modalArkaPlan}>
        <View style={[styles.modalKutusu, { maxHeight: '80%' }]}>
          
          {/* --- ÜST BAŞLIK VE KAPATMA İKONU --- */}
          <View style={styles.modalBaslikKutusu}>
            <Text style={[styles.modalBaslik, { marginBottom: 0 }]}>Zaman Kumbarası 💰</Text>
            
            <TouchableOpacity 
              style={styles.kapatIkonu}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                kapat(); // Ana dosyadan gelen kapatma komutunu çalıştır
              }}
            >
              <Text style={styles.kapatIkonuYazi}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ width: '100%', marginBottom: 20 }}>
            {Object.keys(istatistikler).length === 0 ? (
              <Text style={{ color: '#8E8E93', textAlign: 'center', marginVertical: 40 }}>
                Henüz birikmiş bir zamanınız yok. Çalışmaya başlayın! 🚀
              </Text>
            ) : (
              // Kumbaradaki her bir kategoriyi listele
              Object.keys(istatistikler).map((kategoriAd) => {
                const toplamSaniye = istatistikler[kategoriAd];
                const katRenk = kategoriler.find((k: any) => k.ad === kategoriAd)?.renk || '#34C759';

                return (
                  <View key={kategoriAd} style={styles.istatistikSatir}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.renkNoktasi, { backgroundColor: katRenk }]} />
                      <Text style={styles.istatistikKategoriAd}>{kategoriAd}</Text>
                    </View>
                    <Text style={styles.istatistikSure}>{zamaniFormatla(toplamSaniye)}</Text>
                  </View>
                );
              })
            )}
          </View>
          
          {/* KUMBARAYI SIFIRLA BUTONU */}
          <TouchableOpacity 
            onLongPress={() => {
              Alert.alert("Emin misiniz?", "Tüm istatistikleriniz kalıcı olarak silinecektir.", [
                { text: "Vazgeç" },
                { text: "Sıfırla", style: "destructive", onPress: verileriSifirla } // Ana dosyadan gelen silme komutu
              ]);
            }}
            style={{ marginTop: 15 }}
          >
            <Text style={{ color: '#FF3B30', fontSize: 12 }}>Tüm Verileri Sıfırla (Basılı Tut)</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// Sadece bu Modal'a ait tasarımlar (Ana dosyadan buraya taşıdık)
const styles = StyleSheet.create({
  modalArkaPlan: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    alignItems: 'center',
  },
  modalBaslikKutusu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalBaslik: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  kapatIkonu: {
    backgroundColor: '#2C2C2E',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kapatIkonuYazi: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
  istatistikSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
});