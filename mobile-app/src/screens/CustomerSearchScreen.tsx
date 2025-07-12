import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Text,
  Chip,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import {customerAPI, Customer} from '../services/api';

const CustomerSearchScreen = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Loaded ${data.length} customers`,
      });
    } catch (error) {
      console.error('Error loading customers:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load customers. Check network connection.',
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone_number.includes(searchQuery),
    );
    setFilteredCustomers(filtered);
  };

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'shop':
        return '#1e40af';
      case 'monthly':
        return '#059669';
      case 'order':
        return '#7c3aed';
      default:
        return '#64748b';
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'shop':
        return 'store';
      case 'monthly':
        return 'event';
      case 'order':
        return 'shopping-cart';
      default:
        return 'person';
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    Alert.alert(
      'Update Daily Status',
      `Update delivery status for ${customer.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Update',
          onPress: () =>
            navigation.navigate('DailyUpdate', {customer}),
        },
      ],
    );
  };

  const renderCustomerItem = ({item}: {item: Customer}) => (
    <Card style={styles.customerCard} onPress={() => handleCustomerSelect(item)}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Title style={styles.customerName}>{item.name}</Title>
            <Paragraph style={styles.customerPhone}>{item.phone_number}</Paragraph>
          </View>
          <Surface style={[styles.iconContainer, {backgroundColor: getCustomerTypeColor(item.customer_type) + '20'}]}>
            <Icon
              name={getCustomerTypeIcon(item.customer_type)}
              size={24}
              color={getCustomerTypeColor(item.customer_type)}
            />
          </Surface>
        </View>
        
        <View style={styles.customerDetails}>
          <Chip
            style={[styles.typeChip, {backgroundColor: getCustomerTypeColor(item.customer_type)}]}
            textStyle={styles.chipText}>
            {item.customer_type.toUpperCase()}
          </Chip>
          {item.can_qty && (
            <Text style={styles.canQty}>Cans: {item.can_qty}</Text>
          )}
        </View>
        
        <Paragraph style={styles.customerAddress} numberOfLines={2}>
          {item.address}
        </Paragraph>
        
        <Button
          mode="contained"
          style={styles.updateButton}
          onPress={() => handleCustomerSelect(item)}>
          Update Status
        </Button>
      </Card.Content>
    </Card>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading customers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by name or phone..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#1e40af"
        />
        <Button
          mode="outlined"
          onPress={loadCustomers}
          loading={loading}
          style={styles.refreshButton}>
          Refresh
        </Button>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredCustomers.length} customer(s) found
        </Text>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={item => item.customer_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadCustomers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="search-off" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No customers found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search terms
            </Text>
          </View>
        }
      />
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
    elevation: 2,
  },
  refreshButton: {
    borderColor: '#1e40af',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    color: '#64748b',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  customerCard: {
    marginBottom: 12,
    elevation: 3,
    backgroundColor: 'white',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  customerPhone: {
    color: '#64748b',
    fontSize: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    marginRight: 12,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  canQty: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  customerAddress: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  updateButton: {
    backgroundColor: '#1e40af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
});

export default CustomerSearchScreen;