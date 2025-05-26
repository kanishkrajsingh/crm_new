import React, { useState } from 'react';
import { CreditCard, Search, Filter, Download, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer } from '../types';

const Billing: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Mock data with January to April entries
  const mockBills = [
    // January Bills
    {
      bill_id: 'jan-1',
      customer: {
        customer_id: '1',
        name: 'Rajesh Kumar',
        phone_number: '9876543210',
        customer_type: 'shop'
      } as Customer,
      bill_month: '2024-01',
      can_qty: 62,
      bill_amount: 1860,
      paid_status: true,
      sent_status: true,
      delivery_days: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30] // Regular delivery pattern
    },
    {
      bill_id: 'jan-2',
      customer: {
        customer_id: '2',
        name: 'Ananya Singh',
        phone_number: '8765432109',
        customer_type: 'monthly'
      } as Customer,
      bill_month: '2024-01',
      can_qty: 31,
      bill_amount: 775,
      paid_status: true,
      sent_status: true,
      delivery_days: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31] // Daily delivery
    },

    // February Bills
    {
      bill_id: 'feb-1',
      customer: {
        customer_id: '1',
        name: 'Rajesh Kumar',
        phone_number: '9876543210',
        customer_type: 'shop'
      } as Customer,
      bill_month: '2024-02',
      can_qty: 40,
      bill_amount: 1200,
      paid_status: true,
      sent_status: true,
      delivery_days: [1, 5, 9, 13, 17, 21, 25, 29] // Less frequent deliveries
    },
    {
      bill_id: 'feb-2',
      customer: {
        customer_id: '2',
        name: 'Ananya Singh',
        phone_number: '8765432109',
        customer_type: 'monthly'
      } as Customer,
      bill_month: '2024-02',
      can_qty: 28,
      bill_amount: 700,
      paid_status: true,
      sent_status: true,
      delivery_days: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28] // Regular pattern
    },

    // March Bills
    {
      bill_id: 'mar-1',
      customer: {
        customer_id: '1',
        name: 'Rajesh Kumar',
        phone_number: '9876543210',
        customer_type: 'shop'
      } as Customer,
      bill_month: '2024-03',
      can_qty: 45,
      bill_amount: 1350,
      paid_status: false,
      sent_status: true,
      delivery_days: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31]
    },
    {
      bill_id: 'mar-2',
      customer: {
        customer_id: '2',
        name: 'Ananya Singh',
        phone_number: '8765432109',
        customer_type: 'monthly'
      } as Customer,
      bill_month: '2024-03',
      can_qty: 30,
      bill_amount: 750,
      paid_status: true,
      sent_status: true,
      delivery_days: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
    },

    // April Bills
    {
      bill_id: 'apr-1',
      customer: {
        customer_id: '1',
        name: 'Rajesh Kumar',
        phone_number: '9876543210',
        customer_type: 'shop'
      } as Customer,
      bill_month: '2024-04',
      can_qty: 50,
      bill_amount: 1500,
      paid_status: false,
      sent_status: false,
      delivery_days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] // High frequency start of month
    },
    {
      bill_id: 'apr-2',
      customer: {
        customer_id: '2',
        name: 'Ananya Singh',
        phone_number: '8765432109',
        customer_type: 'monthly'
      } as Customer,
      bill_month: '2024-04',
      can_qty: 25,
      bill_amount: 625,
      paid_status: false,
      sent_status: true,
      delivery_days: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] // Partial month
    },
    {
      bill_id: 'apr-3',
      customer: {
        customer_id: '3',
        name: 'Priya Sharma',
        phone_number: '7654321098',
        customer_type: 'monthly'
      } as Customer,
      bill_month: '2024-04',
      can_qty: 15,
      bill_amount: 375,
      paid_status: true,
      sent_status: true,
      delivery_days: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19] // New customer
    }
  ];

  const filteredBills = mockBills.filter(bill => bill.bill_month === selectedMonth);

  const openLedger = (bill: typeof mockBills[0]) => {
    // Create a new window for the ledger
    const ledgerWindow = window.open('', '_blank');
    if (!ledgerWindow) return;

    const [year, month] = bill.bill_month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

    // Generate calendar HTML
    const calendarHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Ledger - ${bill.customer.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 p-8">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Customer Ledger</h1>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">Customer Name</p>
                <p class="font-medium">${bill.customer.name}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Phone Number</p>
                <p class="font-medium">${bill.customer.phone_number}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Month</p>
                <p class="font-medium">${monthName} ${year}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Cans</p>
                <p class="font-medium">${bill.can_qty}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-lg font-semibold mb-4">Delivery Calendar</h2>
            <div class="grid grid-cols-7 gap-2 mb-2">
              ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                .map(day => `<div class="text-center text-sm font-medium text-gray-500">${day}</div>`)
                .join('')}
            </div>
            <div class="grid grid-cols-7 gap-2">
              ${Array.from({ length: daysInMonth }, (_, i) => i + 1)
                .map(day => `
                  <div class="aspect-square flex items-center justify-center rounded-lg ${
                    bill.delivery_days.includes(day)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }">
                    ${day}
                  </div>
                `)
                .join('')}
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-semibold mb-4">Bill Details</h2>
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">Date</th>
                  <th class="text-center py-2">Cans Delivered</th>
                  <th class="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.delivery_days
                  .map(
                    day => `
                    <tr class="border-b">
                      <td class="py-2">${day} ${monthName} ${year}</td>
                      <td class="text-center">1</td>
                      <td class="text-right">₹30</td>
                    </tr>
                  `
                  )
                  .join('')}
                <tr class="font-semibold">
                  <td class="py-2">Total</td>
                  <td class="text-center">${bill.can_qty}</td>
                  <td class="text-right">₹${bill.bill_amount}</td>
                </tr>
              </tbody>
            </table>
            <div class="mt-6 flex justify-end">
              <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onclick="window.print()">
                Generate Bill
              </button>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    ledgerWindow.document.write(calendarHTML);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer bills and payments</p>
        </div>
        <Button
          variant="primary"
          icon={<CreditCard size={16} />}
          className="mt-3 sm:mt-0"
        >
          Generate Bills
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bills..."
              className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
            />
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="month"
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>
          
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            className="sm:w-auto"
          >
            Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cans
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill.bill_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{bill.customer.name}</div>
                      <div className="text-sm text-gray-500">{bill.customer.phone_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.bill_month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.can_qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{bill.bill_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bill.paid_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bill.paid_status ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openLedger(bill)}
                    >
                      View Ledger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBills.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No bills found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Billing;