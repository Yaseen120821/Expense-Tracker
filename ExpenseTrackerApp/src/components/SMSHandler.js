import { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTransactionSms, extractTransactionData, generateHash } from '../utils/regex';
import { classifyExpense } from '../services/api';

export const requestSmsPermission = async () => {
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    ]);
    
    if (
      granted['android.permission.READ_SMS'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.RECEIVE_SMS'] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log('SMS permissions granted');
      return true;
    }
    console.log('SMS permissions denied');
    return false;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const processIncomingSms = async (body, onParseComplete) => {
  
  if (!isTransactionSms(body)) {
    return; // Ignore silently
  }

  const { amount, merchant, type } = extractTransactionData(body);
  if (!amount) return; // Couldn't parse cleanly

  const today = new Date().toISOString().split('T')[0];
  const hash = generateHash(amount, merchant, today);

  // Check Dedup
  const hashes = JSON.parse((await AsyncStorage.getItem('sms_hashes')) || '[]');
  if (hashes.includes(hash)) return;

  // Ask Next.js backend to classify using the clean tokens only
  try {
    const aiResult = await classifyExpense({ amount, merchant, type });
    const finalCategory = aiResult.category || 'General';

    // Store hash
    hashes.push(hash);
    await AsyncStorage.setItem('sms_hashes', JSON.stringify(hashes));

    // Send to UI stack for confirmation modal
    onParseComplete({
      amount,
      merchant,
      type,
      category: finalCategory,
      hash,
      date: new Date().toISOString(),
      source: 'sms_auto'
    });

  } catch (error) {
    console.error('Failed to process SMS automatically', error);
  }
};

export const useSmsListener = (onParseComplete) => {
  useEffect(() => {
    let subscriber = null;

    const initListener = async () => {
      const isEnabled = await AsyncStorage.getItem('sms_tracking_enabled');
      // Default to true on fresh installations
      if (isEnabled === 'false') return;

      const hasPerm = await requestSmsPermission();
      if (!hasPerm) return;

      console.log('Starting SMS Listener via DeviceEventEmitter...');
      
      subscriber = SmsListener.addListener((message) => {
        if (message && message.body) {
          processIncomingSms(message.body, onParseComplete);
        }
      });
    };

    initListener();

    return () => {
      if (subscriber) subscriber.remove();
    };
  }, [onParseComplete]);
};
