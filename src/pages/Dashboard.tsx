import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  //TrendingUp, 
  Users, 
  Package, 
  RefreshCw, 
  ShoppingCart,
  Clock
} from 'lucide-react';
import Card from '../components/ui/Card';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const handleNewCustomerFromDashboard = () => {
    navigate('/customers/new', { state: { fromDashboard: true } });
  };
  const handleOrderClick = () => {
    navigate('/orders/new');
  };
  

  const [stats, setStats] = useState({
    OrdersTotal: 0,
    totalMonthlyCustomers: 0,
    shopCustomersTotal: 0,
    cansDeliveredToday: 0,
    cansCollectedToday: 0,
    pendingCansTotal: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Replace these with your actual API endpoints
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await fetch('/api/dashboard');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error('Failed to fetch dashboard stats');
        }

        const activityResponse = await fetch('/api/dashboard/');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData);
        } else {
          console.error('Failed to fetch recent activity');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: ' Orders',
      value: stats.OrdersTotal,
      icon: <ShoppingCart className="h-8 w-8 text-blue-500" />,
      //change: '+12% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Monthly Customers',
      value: stats.totalMonthlyCustomers,
      icon: <Users className="h-8 w-8 text-teal-500" />,
      //change: '+2 this week', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Shop Customers ',
      value: stats.shopCustomersTotal,
      icon: <Users className="h-8 w-8 text-teal-500" />,
     // change: '78% of total', // Replace with actual calculation if available in API
      trend: 'neutral'
    },
    {
      title: 'Cans Delivered Today',
      value: stats.cansDeliveredToday,
      icon: <Package className="h-8 w-8 text-green-500" />,
      change: '+7% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Cans Collected Today',
      value: stats.cansCollectedToday,
      icon: <RefreshCw className="h-8 w-8 text-orange-500" />,
      change: '+5% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Pending Cans',
      value: stats.pendingCansTotal,
      icon: <Clock className="h-8 w-8 text-red-500" />,
      //change: '-3% from yesterday', // Replace with actual calculation if available in API
      trend: 'down'
    }
  ];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">An overview of your RO water business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{card.value}</p>
                <p className={`mt-1 text-sm ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {card.change}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-full">
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="Recent Activity" 
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">10 cans delivered to Sunset Cafe</p>
                <p className="text-sm text-gray-500">Today, 9:45 AM</p>
              </div>
            </div>
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <RefreshCw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">8 cans collected from Royal Restaurant</p>
                <p className="text-sm text-gray-500">Today, 11:20 AM</p>
              </div>
            </div>
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-2 bg-teal-100 rounded-full mr-3">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium">New monthly customer added: Ramesh Patil</p>
                <p className="text-sm text-gray-500">Today, 1:30 PM</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-3">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">New order from Green Valley Apartments</p>
                <p className="text-sm text-gray-500">Today, 3:15 PM</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card title="Quick Tasks">
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Record Today's Delivery
              
            </button>
            <button className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 transition-colors flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Update Can Collection
            </button>
            <button className="w-full text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 transition-colors flex items-center"onClick={handleOrderClick} >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add New Order
            </button>
            <button className="w-full text-left px-3 py-2 bg-teal-50 hover:bg-teal-100 rounded-lg text-teal-700 transition-colors flex items-center" onClick={handleNewCustomerFromDashboard}>
              <Users className="h-5 w-5 mr-2" />
              Register New Customer
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;