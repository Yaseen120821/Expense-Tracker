import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Modal, TouchableOpacity } from 'react-native';
import { useSmsListener } from '../components/SMSHandler';
import { syncExpense } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);

  // Hook into the SMS Receiver Native Emitter
  useSmsListener((parsedData) => {
    // Check if auto-save mode is on (read from AsyncStorage usually)
    // For now, always show confirmation modal a requested (Safe Mode)
    setPendingTxn(parsedData);
    setModalVisible(true);
  });

  const handleConfirm = async () => {
    if (!pendingTxn) return;
    try {
      await syncExpense(pendingTxn);
      setModalVisible(false);
      setPendingTxn(null);
      // Refresh local list if you had one
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AI Expense Tracker</Text>
      <Text style={styles.subtext}>Awaiting incoming bank SMS in background...</Text>

      <Button title="Go to Settings" onPress={() => navigation.navigate('Settings')} />
      <View style={{ height: 20 }} />
      <Button title="Scan Receipt (Camera)" onPress={() => navigation.navigate('Scan')} />

      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Transaction Detected!</Text>
            {pendingTxn && (
              <>
                <Text style={styles.modalAmount}>
                  {pendingTxn.type === 'debit' ? '-' : '+'}₹{pendingTxn.amount}
                </Text>
                <Text style={styles.modalMerchant}>{pendingTxn.merchant}</Text>
                <Text style={styles.modalCategory}>Category: {pendingTxn.category}</Text>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={[styles.btn, styles.confirmBtn]} onPress={handleConfirm}>
                    <Text style={styles.btnTxt}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.btnTxt}>Ignore</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#0F172A' },
  subtext: { textAlign: 'center', marginBottom: 40, color: '#64748B' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalAmount: { fontSize: 36, fontWeight: '900', color: '#0F172A' },
  modalMerchant: { fontSize: 16, color: '#475569', marginBottom: 8 },
  modalCategory: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginBottom: 24, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#DCFCE7', borderRadius: 8 },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center' },
  confirmBtn: { backgroundColor: '#16A34A' },
  btnTxt: { fontWeight: 'bold', color: '#0F172A' },
});

export default HomeScreen;
