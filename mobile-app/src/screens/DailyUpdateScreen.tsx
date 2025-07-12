import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Text,
  Surface,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import {dailyUpdateAPI, Customer} from '../services/api';

const DailyUpdateScreen = ({route, navigation}: any) => {
  const {customer}: {customer: Customer} = route.params;
  const [delivered, setDelivered] = useState('');
  const [collected, setCollected] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setSaving] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadCurrentStatus();
  }, []);

  const loadCurrentStatus = async () => {
    try {
      setLoadingStatus(true);
      const status = await dailyUpdateAPI.getCustomerStatus(customer.customer_id, today);
      if (status) {
        setCurrentStatus(status);
        setDelivered(status.delivered_qty.toString());
        setCollected(status.collected_qty.toString());
        setNotes(status.notes || '');
      } else {
        // Set default values for new entry
        setDelivered(customer.can_qty?.toString() || '0');
        setCollected('0');
      }
    } catch (error) {
      console.error('Error loading status:', error);
      // Set defaults if can't load
      setDelivered(customer.can_qty?.toString() || '0');
      setCollected('0');
    } finally {
      setLoadingStatus(false);
    }
  };

  const calculateHoldingStatus = () => {
    const deliveredQty = parseInt(delivered) || 0;
    const collectedQty = parseInt(collected) || 0;
    const previousHolding = currentStatus?.holding_status || 0;
    
    // If this is an existing update, calculate from current values
    if (currentStatus) {
      return deliveredQty - collectedQty + (previousHolding - currentStatus.delivered_qty + currentStatus.collected_qty);
    }
    
    // For new updates, calculate from delivered - collected
    return deliveredQty - collectedQty;
  };

  const handleSave = async () => {
    const deliveredQty = parseInt(delivered) || 0;
    const collectedQty = parseInt(collected) || 0;

    if (deliveredQty < 0 || collectedQty < 0) {
      Alert.alert('Invalid Input', 'Quantities cannot be negative');
      return;
    }

    if (collectedQty > deliveredQty + (currentStatus?.holding_status || 0)) {
      Alert.alert(
        'Invalid Input',
        'Collected quantity cannot exceed available cans'
      );
      return;
    }

    try {
      setSaving(true);
      
      const updateData = {
        customer_id: customer.customer_id,
        date: today,
        delivered_qty: deliveredQty,
        collected_qty: collectedQty,
        notes: notes.trim(),
      };

      await dailyUpdateAPI.saveDailyUpdate(updateData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Updated status for ${customer.name}`,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error saving update:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save update. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'shop': return '#1e40af';
      case 'monthly': return '#059669';
      case 'order': return '#7c3aed';
      default: return '#64748b';
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'shop': return 'store';
      case 'monthly': return 'event';
      case 'order': return 'shopping-cart';
      default: return 'person';
    }
  };

  if (loadingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading customer status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Customer Info Card */}
      <Card style={styles.customerCard}>
        <Card.Content>
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Title style={styles.customerName}>{customer.name}</Title>
              <Paragraph style={styles.customerPhone}>{customer.phone_number}</Paragraph>
              <Paragraph style={styles.customerAddress} numberOfLines={2}>
                {customer.address}
              </Paragraph>
            </View>
            <Surface style={[styles.iconContainer, {backgroundColor: getCustomerTypeColor(customer.customer_type) + '20'}]}>
              <Icon
                name={getCustomerTypeIcon(customer.customer_type)}
                size={32}
                color={getCustomerTypeColor(customer.customer_type)}
              />
            </Surface>
          </View>
          
          <View style={styles.customerMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={[styles.metaValue, {color: getCustomerTypeColor(customer.customer_type)}]}>
                {customer.customer_type.toUpperCase()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Default Cans</Text>
              <Text style={styles.metaValue}>{customer.can_qty || 0}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-IN')}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Current Status Card */}
      {currentStatus && (
        <Card style={styles.statusCard}>
          <Card.Content>
            <Title style={styles.statusTitle}>Current Status</Title>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Icon name="local-shipping" size={24} color="#1e40af" />
                <Text style={styles.statusValue}>{currentStatus.delivered_qty}</Text>
                <Text style={styles.statusLabel}>Delivered</Text>
              </View>
              <View style={styles.statusItem}>
                <Icon name="assignment-return" size={24} color="#059669" />
                <Text style={styles.statusValue}>{currentStatus.collected_qty}</Text>
                <Text style={styles.statusLabel}>Collected</Text>
              </View>
              <View style={styles.statusItem}>
                <Icon name="inventory" size={24} color="#dc2626" />
                <Text style={styles.statusValue}>{currentStatus.holding_status}</Text>
                <Text style={styles.statusLabel}>Holding</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Update Form Card */}
      <Card style={styles.formCard}>
        <Card.Content>
          <Title style={styles.formTitle}>Update Daily Status</Title>
          <Divider style={styles.divider} />
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Delivered Quantity"
              value={delivered}
              onChangeText={setDelivered}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="local-shipping" />}
              theme={{colors: {primary: '#1e40af'}}}
            />
            
            <TextInput
              label="Collected Quantity"
              value={collected}
              onChangeText={setCollected}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="assignment-return" />}
              theme={{colors: {primary: '#059669'}}}
            />
            
            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              left={<TextInput.Icon icon="note" />}
              theme={{colors: {primary: '#7c3aed'}}}
            />
          </View>

          {/* Calculated Holding Status */}
          <Surface style={styles.calculationCard}>
            <View style={styles.calculationHeader}>
              <Icon name="calculate" size={20} color="#7c3aed" />
              <Text style={styles.calculationTitle}>Calculated Holding Status</Text>
            </View>
            <Text style={styles.calculationValue}>{calculateHoldingStatus()} cans</Text>
            <Text style={styles.calculationNote}>
              This will be the new holding status after update
            </Text>
          </Surface>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}>
              {loading ? 'Saving...' : 'Save Update'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 16,
  },
  customerCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: 'white',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerPhone: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 4,
  },
  customerAddress: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    backgroundColor: 'white',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 32,
    elevation: 3,
    backgroundColor: 'white',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  divider: {
    marginVertical: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  calculationCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 24,
    elevation: 1,
  },
  calculationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculationTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  calculationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  calculationNote: {
    fontSize: 12,
    color: '#64748b',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#64748b',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#1e40af',
  },
});

export default DailyUpdateScreen;