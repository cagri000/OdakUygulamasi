import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';

// DİKKAT: Statik KATEGORILER listesini buradan sildik!

interface Props {
  secilen: string;
  setSecilen: (kategori: string) => void;
  kategoriler: any[]; // YENİ: Artık listeyi App.tsx'ten alacak!
  yeniEkleBasildi: () => void; // YENİ: "+" butonuna basılınca App.tsx'e haber verecek!
  kategoriSil: (id: string, ad: string) => void;
}

export default function KategoriSecici({ secilen, setSecilen, kategoriler, yeniEkleBasildi, kategoriSil }: Props) {
  return (
    <View style={styles.kategoriKutusu}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={kategoriler} // Veri artık dışarıdan (Props) geliyor
        keyExtractor={(item) => item.id}
        // YENİ: Listenin en sağına bir "+" butonu ekliyoruz (ListFooterComponent)
        ListFooterComponent={
          <TouchableOpacity style={styles.ekleButonu} onPress={yeniEkleBasildi}>
            <Text style={styles.kategoriIkon}>➕</Text>
            <Text style={styles.kategoriYazi}>Yeni Ekle</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const aktifMi = secilen === item.ad;
          return (
            <Pressable
              style={[
                styles.kategoriButonu,
                aktifMi ? { backgroundColor: item.renk, borderColor: item.renk } : null
              ]}
              onPress={() => setSecilen(item.ad)}
              onLongPress={() => {
                // RÖNTGEN CİHAZIMIZ: Bu yazı bilgisayardaki siyah ekrana (Terminal) düşecek!
                console.log("🚨 UZUN BASILDI YAKALANDI! Hedef:", item.ad);
                kategoriSil(item.id, item.ad);
              }}
              delayLongPress={400} // 400 milisaniye idealdir 
            >
              <Text style={styles.kategoriIkon}>{item.ikon}</Text>
              <Text style={[styles.kategoriYazi, aktifMi ? { color: 'white' } : null]}>
                {item.ad}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// --- SADECE BU BİLEŞENE AİT TASARIMLAR ---
const styles = StyleSheet.create({
  kategoriKutusu: {
    height: 60,
    marginBottom: 30, // Ana sayfadaki diğer elemanlarla arasını açar
  },
  kategoriButonu: {
    flexDirection: 'row', // İkon ve yazıyı yan yana diz
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3A3A3C', // Sönük gri çerçeve
    backgroundColor: '#1C1C1E', // Arka planla aynı renk
  },
  kategoriIkon: {
    fontSize: 18,
    marginRight: 6,
  },
  kategoriYazi: {
    color: '#8E8E93', // Sönük gri yazı
    fontSize: 16,
    fontWeight: '600',
  },
  ekleButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#34C759', // Dikkat çekici yeşil bir çerçeve
    borderStyle: 'dashed', // Kesik çizgili tasarım (Yeni ekleneceğini hissettirir)
  },
});