// src/pages/Billing.tsx
import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, Calendar, Save } from 'lucide-react'; // Import Save icon
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Assuming PdfLedgerTemplate is imported but not directly used in the modal HTML
// import PdfLedgerTemplate from '../components/Billing/PdfLedgerTemplate';

const Billing: React.FC = () => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ledgerHTML, setLedgerHTML] = useState('');
    const [selectedBillForModal, setSelectedBillForModal] = useState<any | null>(null);

    const [isGeneratingBills, setIsGeneratingBills] = useState(false);
    const [isSavingBills, setIsSavingBills] = useState(false); // NEW STATE FOR SAVING TO DB

    useEffect(() => {
        fetchMonthlyBills(selectedMonth);
    }, [selectedMonth]);

    const fetchMonthlyBills = async (month: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/daily-updates/monthly-bills?month=${month}`);
            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }
            const data = await response.json();
            setBills(data);
        } catch (err: any) {
            setError(err.message);
            toast.error('Failed to fetch bills');
        } finally {
            setLoading(false);
        }
    };

    const generatePdfForBill = async (bill: any, currentPrice: any) => {
        let ledgerData = [];
        try {
            const response = await fetch(`/api/daily-updates/ledger?customer_id=${bill.customer_id}&month=${selectedMonth}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ledger data for PDF');
            }
            ledgerData = await response.json();
        } catch (err) {
            console.error(`Error fetching ledger data for ${bill.name}:`, err);
            toast.error(`Failed to get ledger for ${bill.name}. Bill might be incomplete.`, { id: `ledger-fetch-${bill.customer_id}` });
            return null;
        }

        try {
            const pdfResponse = await fetch('/generate-bill-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bill: bill,
                    ledgerData: ledgerData,
                    currentPrice: currentPrice,
                    selectedMonth: selectedMonth,
                }),
            });

            if (!pdfResponse.ok) {
                const errorText = await pdfResponse.text();
                throw new Error(`Server error: ${pdfResponse.status} ${pdfResponse.statusText} - ${errorText}`);
            }

            return pdfResponse.blob();
        } catch (error) {
            console.error("Error generating PDF via backend:", error);
            throw error;
        }
    };

    const handleGenerateAllBills = async () => {
        setIsGeneratingBills(true);
        const generationToastId = toast.loading('Preparing to generate bills...');

        try {
            const pricesResponse = await fetch('/api/settings/prices');
            if (!pricesResponse.ok) {
                throw new Error('Failed to fetch prices for bill generation.');
            }
            const prices = await pricesResponse.json();
            const currentPrice = prices[0];

            if (!currentPrice) {
                toast.error('Current pricing data not found. Cannot generate bills.', { id: generationToastId });
                setIsGeneratingBills(false);
                return;
            }

            const zip = new JSZip();
            const pdfGenerationPromises = filteredBills.map(async (bill) => {
                const billToastId = toast.loading(`Generating bill for ${bill.name}...`, { duration: 0 });
                try {
                    const pdfBlob = await generatePdfForBill(bill, currentPrice);
                    if (pdfBlob) {
                        const filename = `${bill.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-bill.pdf`;
                        zip.file(filename, pdfBlob);
                        toast.success(`Bill generated for ${bill.name}`, { id: billToastId });
                    } else {
                        toast.error(`Could not generate PDF for ${bill.name}.`, { id: billToastId });
                    }
                } catch (error) {
                    console.error(`Error generating PDF for ${bill.name}:`, error);
                    toast.error(`Failed to generate bill for ${bill.name}.`, { id: billToastId });
                }
            });

            await Promise.all(pdfGenerationPromises);

            if (Object.keys(zip.files).length === 0) {
                toast.error('No PDFs were successfully generated to zip.', { id: generationToastId });
                setIsGeneratingBills(false);
                return;
            }

            const [year, monthNum] = selectedMonth.split('-');
            const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
            const zipFilename = `${monthName.replace(/[^a-zA-Z0-9]/g, '').trim()}-${year}-bills.zip`;

            toast.loading('Zipping bills...', { id: generationToastId });
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, zipFilename);
            toast.success('All bills zipped and downloaded!', { id: generationToastId, duration: 3000 });

        } catch (mainError) {
            console.error('Error in overall bill generation process:', mainError);
            toast.error(`Error generating all bills: ${mainError instanceof Error ? mainError.message : String(mainError)}`, { id: generationToastId });
        } finally {
            setIsGeneratingBills(false);
        }
    };

    // NEW FUNCTION TO SAVE ALL BILLS TO DATABASE
    const handleSaveAllBillsToDB = async () => {
        setIsSavingBills(true);
        const saveToastId = toast.loading('Saving bills to database...');

        if (filteredBills.length === 0) {
            toast.error('No bills to save for the selected month.', { id: saveToastId });
            setIsSavingBills(false);
            return;
        }

        const billsToSave = filteredBills.map(bill => ({
            customer_id: bill.customer_id,
            bill_month: selectedMonth,
            paid_status: bill.paid_status || false, // Ensure boolean, default to false if undefined
            sent_status: false, // Assuming 'sent_status' is false by default when saving, or you can add UI for it
            bill_amount: bill.bill_amount,
            total_cans: bill.total_cans_delivered,
            delivery_days: bill.total_delivery_days,
            // created_at will be set by the backend
            // bill_id will be generated by the backend
        }));

        try {
            // Replace with your actual backend API endpoint for saving bills
            const response = await fetch('/api/bills/save-monthly-bills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bills: billsToSave }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save bills to database.');
            }

            toast.success('All bills saved successfully to database!', { id: saveToastId, duration: 3000 });
            // Optionally, re-fetch bills to update the UI or reflect saved status
            fetchMonthlyBills(selectedMonth);

        } catch (error: any) {
            console.error('Error saving bills to database:', error);
            toast.error(`Failed to save bills: ${error.message || 'Unknown error'}`, { id: saveToastId });
        } finally {
            setIsSavingBills(false);
        }
    };


    const openLedger = async (bill: any) => {
        try {
            setSelectedBillForModal(bill);
            setIsModalOpen(true);

            const pricesResponse = await fetch('/api/settings/prices');
            if (!pricesResponse.ok) {
                throw new Error('Failed to fetch prices');
            }
            const prices = await pricesResponse.json();
            const currentPrice = prices[0];

            const response = await fetch(`/api/daily-updates/ledger?customer_id=${bill.customer_id}&month=${selectedMonth}`);
            if (!response.ok) {
                throw new Error('Failed to fetch ledger data');
            }
            const ledgerData = await response.json();

            const [year, month] = selectedMonth.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

            const pricePerCan = bill.customer_type === 'shop' ? currentPrice.shop_price :
                bill.customer_type === 'monthly' ? currentPrice.monthly_price :
                    currentPrice.order_price;

            const totalCans = ledgerData.reduce((sum: number, d: { delivered_qty: any; }) => sum + Number(d.delivered_qty), 0);
            const totalAmount = totalCans * pricePerCan;

            // Prepare ledger entries for display in two columns
            const totalDaysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
            const leftColumnLength = Math.ceil(totalDaysInMonth / 2);
            // const rightColumnLength = totalDaysInMonth - leftColumnLength; // Not strictly needed here

            let ledgerRows = '';
            for (let i = 0; i < leftColumnLength; i++) {
                const dateLeft = i + 1;
                const ledgerEntryLeft = ledgerData.find((entry: any) => new Date(entry.delivery_date).getDate() === dateLeft);
                const deliveredQtyLeft = ledgerEntryLeft ? ledgerEntryLeft.delivered_qty : '';

                const dateRight = leftColumnLength + i + 1;
                const ledgerEntryRight = ledgerData.find((entry: any) => new Date(entry.delivery_date).getDate() === dateRight);
                const deliveredQtyRight = dateRight <= totalDaysInMonth ? (ledgerEntryRight ? ledgerEntryRight.delivered_qty : '') : '';

                ledgerRows += `
                    <tr>
                        <td class="border border-black p-1 text-center">${dateLeft}</td>
                        <td class="border border-black p-1 text-center">${deliveredQtyLeft}</td>
                        <td class="border border-black p-1"></td>
                        <td class="border border-black p-1 text-center">${dateRight <= totalDaysInMonth ? dateRight : ''}</td>
                        <td class="border border-black p-1 text-center">${deliveredQtyRight}</td>
                        <td class="border border-black p-1"></td>
                    </tr>`;
            }


            const calendarHTML = `
            <!DOCTYPE html>
<html>
<head>
<title>Customer Ledger - ${bill.name} (${monthName} ${year})</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-4">
<div class="max-w-xl mx-auto border border-black p-4">
    <div class="flex justify-between items-center border-b border-black pb-2 mb-2">
    <div class="text-left text-xs">
        <div class="font-bold text-blue-900 text-lg">कंचन मिनरल वाटर</div>
        <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
        <div>Ph.: 07422-408555 Mob.: 9425033995</div>
    </div>
    <div class="text-center text-xs">
        <div class="font-bold text-blue-900 text-lg">कंचन चिल्ड वाटर</div>
        <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
        <div>Mob.: 9685753343, 9516784779</div>
    </div>
    </div>

    <div class="grid grid-cols-2 text-sm border-b border-black pb-1 mb-2">
    <div>मो.: ${bill.phone_number}</div>
    <div class="text-right">दिनांक: ${monthName} ${year}</div>
    <div class="col-span-2">श्रीमान: ${bill.name}</div>
    </div>

    <table class="w-full text-xs border border-black border-collapse">
    <thead>
        <tr>
        <th class="border border-black p-1">दिनांक</th>
        <th class="border border-black p-1">संख्या</th>
        <th class="border border-black p-1">केन वापसी</th>
        <th class="border border-black p-1">दिनांक</th>
        <th class="border border-black p-1">संख्या</th>
        <th class="border border-black p-1">केन वापसी</th>
        </tr>
    </thead>
    <tbody>
        ${(() => {
            const date = new Date(year, new Date(Date.parse(monthName + " 1, " + year)).getMonth() + 1, 0);
            const daysInMonth = date.getDate();
            const rows = [];
            for (let i = 0; i < Math.ceil(daysInMonth / 2); i++) {
                const leftDay = i + 1;
                const rightDay = i + 1 + Math.ceil(daysInMonth / 2); // Adjust for the second column's start
                const left = ledgerData[i];
                const right = ledgerData[i + Math.ceil(daysInMonth / 2)];

                rows.push(`
                <tr>
                    <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${leftDay <= daysInMonth ? leftDay : ''}</td>
                    <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${left && leftDay <= daysInMonth ? left.delivered_qty : ''}</td>
                    <td style="border: 1px solid black; padding: 0.25rem;"></td>
                    <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${rightDay <= daysInMonth ? rightDay : ''}</td>
                    <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${right && rightDay <= daysInMonth ? right.delivered_qty : ''}</td>
                    <td style="border: 1px solid black; padding: 0.25rem;"></td>
                </tr>`);
            }
            return rows.join('');
        })()}
    </tbody>
    </table>

    <div class="flex justify-between items-center border-t border-black mt-2 pt-1 text-sm">
    <div class="text-xs">
        <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
        <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
        <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
    </div>
    <div class="text-right font-bold border border-black px-2 py-1 text-xs">
        <div>कुल केन: ${totalCans}</div>
        <div>कुल राशि: ₹${totalAmount}</div>
    </div>
    </div>
</div>
</body>
</html>
            `;
            setLedgerHTML(calendarHTML);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Error in openLedger:", err);
            toast.error('Failed to fetch ledger data for modal');
        }
    };

    const filteredBills = bills.filter(bill => {
        const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bill.phone_number.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'paid' && bill.paid_status) ||
            (filterStatus === 'unpaid' && !bill.paid_status);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return <div>Loading billing data...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage customer bills and track deliveries</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-0"> {/* Adjusted for multiple buttons */}
                    <Button
                        variant="primary"
                        icon={<CreditCard size={16} />}
                        onClick={handleGenerateAllBills}
                        disabled={isGeneratingBills}
                    >
                        {isGeneratingBills ? (
                            <>
                                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></div>
                                Generating...
                            </>
                        ) : (
                            'Generate Bills'
                        )}
                    </Button>
                    {/* NEW BUTTON FOR SAVING TO DATABASE */}
                    <Button
                        variant="secondary" // Or primary, depending on your desired styling
                        icon={<Save size={16} />} // Use the Save icon
                        onClick={handleSaveAllBillsToDB}
                        disabled={isSavingBills || isGeneratingBills} // Disable if already generating or saving
                    >
                        {isSavingBills ? (  
                            <>
                                <div className="spinner" style={{ border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}></div>
                                Saving...
                            </>
                        ) : (
                            'Save All Bills to DB'
                        )}
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>


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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
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
                        // You might want to integrate this Export button with CSV/Excel export logic
                        // For now, it's just a placeholder
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
                                    Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Cans
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Delivery Days
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
                                <tr key={bill.customer_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="font-medium text-gray-900">{bill.name}</div>
                                            <div className="text-sm text-gray-500">{bill.phone_number}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {bill.customer_type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {bill.total_cans_delivered}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {bill.total_delivery_days}
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

                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded shadow-lg p-4 relative">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute top-2 right-2 text-gray-600 hover:text-black"
                                >
                                    ✖
                                </button>
                                <div dangerouslySetInnerHTML={{ __html: ledgerHTML }} />
                            </div>
                        </div>
                    )}
                </div>

                {filteredBills.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No bills found for the selected month.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Billing;