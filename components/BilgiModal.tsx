import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  acikMi: boolean;
  kapat: () => void;
}

export default function BilgiModal({ acikMi, kapat }: Props) {
  return (
    <Modal visible={acikMi} animationType="fade" transparent={true}>
      <View style={styles.modalArkaPlan}>
        <View style={styles.modalKutusu}>
          
          {/* Üst Başlık ve Kapatma İkonu */}
          <View style={styles.modalBaslikKutusu}>
            <Text style={styles.modalBaslik}>Gizli Özellikler 💡</Text>
            <TouchableOpacity 
              style={styles.kapatIkonu}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                kapat();
              }}
            >
              <Text style={styles.kapatIkonuYazi}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* İpuçları Listesi */}
          <View style={styles.ipucuKutusu}>
            <Text style={styles.ipucuIkon}>📱</Text>
            <View style={styles.ipucuMetinKutusu}>
              <Text style={styles.ipucuBaslik}>Otomatik Başlatma</Text>
              <Text style={styles.ipucuAciklama}>Ters çevir modunda  sayacı başlatmak için ekrana dokunmanıza gerek yok. Telefonu masaya ters çevirin, odaklanma başlasın!</Text>
            </View>
          </View>

          <View style={styles.ipucuKutusu}>
            <Text style={styles.ipucuIkon}>🎧</Text>
            <View style={styles.ipucuMetinKutusu}>
              <Text style={styles.ipucuBaslik}>Ortam Sesi Seçimi</Text>
              <Text style={styles.ipucuAciklama}>Üstteki kulaklık ikonuna basılı tutarak farklı odaklanma sesleri (Yağmur, Kafe, Orman) seçebilirsiniz.</Text>
            </View>
          </View>

          <View style={styles.ipucuKutusu}>
            <Text style={styles.ipucuIkon}>🗑️</Text>
            <View style={styles.ipucuMetinKutusu}>
              <Text style={styles.ipucuBaslik}>Verileri Sıfırlama</Text>
              <Text style={styles.ipucuAciklama}>İstatistik ekranının en altındaki kırmızı yazıya uzun basarak tüm geçmişinizi silebilirsiniz.</Text>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

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
  },
  modalBaslikKutusu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalBaslik: {
    color: 'white',
    fontSize: 20,
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
  ipucuKutusu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 15,
  },
  ipucuIkon: {
    fontSize: 24,
    marginRight: 15,
  },
  ipucuMetinKutusu: {
    flex: 1,
  },
  ipucuBaslik: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  ipucuAciklama: {
    color: '#AEAEB2',
    fontSize: 14,
    lineHeight: 20,
  },
});