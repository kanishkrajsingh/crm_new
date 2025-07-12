import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Text,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const {width} = Dimensions.get('window');

const HomeScreen = ({navigation}: any) => {
  const today = new Date().toLocaleDateString('en-IN');

  const quickActions = [
    {
      title: 'Search Customers',
      subtitle: 'Find customers for delivery',
      icon: 'search',
      color: '#1e40af',
      onPress: () => navigation.navigate('CustomerSearch'),
    },
    {
      title: 'Daily Updates',
      subtitle: 'Update delivery status',
      icon: 'update',
      color: '#059669',
      onPress: () => navigation.navigate('DailyUpdate'),
    },
  ];

  const stats = [
    {title: 'Today\'s Deliveries', value: '0', icon: 'local-shipping', color: '#1e40af'},
    {title: 'Collections', value: '0', icon: 'assignment-return', color: '#059669'},
    {title: 'Pending Updates', value: '0', icon: 'pending-actions', color: '#dc2626'},
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <View>
              <Title style={styles.welcomeTitle}>Welcome Back!</Title>
              <Paragraph style={styles.dateText}>Today: {today}</Paragraph>
            </View>
            <Surface style={styles.logoContainer}>
              <Icon name="local-shipping" size={40} color="#1e40af" />
            </Surface>
          </View>
        </Card.Content>
      </Card>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name={stat.icon} size={24} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickActions.map((action, index) => (
          <Card key={index} style={styles.actionCard}>
            <Card.Content>
              <View style={styles.actionContent}>
                <View style={styles.actionInfo}>
                  <Title style={styles.actionTitle}>{action.title}</Title>
                  <Paragraph style={styles.actionSubtitle}>
                    {action.subtitle}
                  </Paragraph>
                </View>
                <Button
                  mode="contained"
                  onPress={action.onPress}
                  style={[styles.actionButton, {backgroundColor: action.color}]}
                  contentStyle={styles.actionButtonContent}>
                  <Icon name={action.icon} size={20} color="white" />
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Instructions */}
      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Title style={styles.instructionsTitle}>How to Use</Title>
          <Divider style={styles.divider} />
          <View style={styles.instructionItem}>
            <Icon name="search" size={20} color="#1e40af" />
            <Text style={styles.instructionText}>
              Search for customers by name or phone number
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="edit" size={20} color="#059669" />
            <Text style={styles.instructionText}>
              Update delivery and collection quantities
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="sync" size={20} color="#7c3aed" />
            <Text style={styles.instructionText}>
              Data syncs automatically with main system
            </Text>
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
  headerCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: 'white',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dateText: {
    color: '#64748b',
    marginTop: 4,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
  },
  statsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  actionsContainer: {
    margin: 16,
  },
  actionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  actionSubtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 25,
  },
  actionButtonContent: {
    paddingHorizontal: 8,
  },
  instructionsCard: {
    margin: 16,
    marginBottom: 32,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  divider: {
    marginVertical: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionText: {
    marginLeft: 12,
    color: '#64748b',
    flex: 1,
  },
});

export default HomeScreen;