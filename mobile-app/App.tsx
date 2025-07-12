import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import HomeScreen from './src/screens/HomeScreen';
import CustomerSearchScreen from './src/screens/CustomerSearchScreen';
import DailyUpdateScreen from './src/screens/DailyUpdateScreen';
import {theme} from './src/theme/theme';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1e40af',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'Kanchan Delivery'}}
          />
          <Stack.Screen
            name="CustomerSearch"
            component={CustomerSearchScreen}
            options={{title: 'Search Customers'}}
          />
          <Stack.Screen
            name="DailyUpdate"
            component={DailyUpdateScreen}
            options={{title: 'Update Daily Status'}}
          />
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;