require('dotenv').config();
const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const customerRoutes = require('./routes/customer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const orderRoutes = require('./routes/orders.routes');
const dailyUpdates = require('./routes/daily-update.routes');
const settingsRoutes = require('./routes/settings.routes');
const billsRoutes = require('./routes/bills.routes');

const pool = require('./database');

const app = express();
const port = process.env.SERVER_PORT || 5000;

app.use(cors());
app.use(express.json());

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database!');
    connection.release();
});

// Use the route files
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/daily-updates', dailyUpdates);
app.use('/api/settings', settingsRoutes);
app.use('/api/bills', billsRoutes);

// PDF generation route for bills
app.post('/generate-bill-pdf', async (req, res) => {
    const { bill, ledgerData, currentPrice, selectedMonth } = req.body;

    if (!bill || !ledgerData || !currentPrice || !selectedMonth) {
        return res.status(400).send('Missing required data for PDF generation');
    }

    let browser;
    try {
        const [year, monthNum] = selectedMonth.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });

        const pricePerCan = bill.customer_type === 'shop' ? currentPrice.shop_price :
                             bill.customer_type === 'monthly' ? currentPrice.monthly_price :
                             currentPrice.order_price;

        const totalCans = ledgerData.reduce((sum, d) => sum + Number(d.delivered_qty), 0);
        const totalAmount = totalCans * pricePerCan;

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Customer Ledger - ${bill.name} (${monthName} ${year})</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { font-family: sans-serif; margin: 0; padding: 0; }
                .pdf-container {
                    width: 36rem;
                    margin: 0 auto;
                    border: 1px solid black;
                    padding: 1rem;
                    box-sizing: border-box;
                    font-size: 10px;
                }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                .amount-box {
                    text-align: right;
                    font-weight: bold;
                    border: 1px solid black;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    display: inline-block;
                }
              </style>
            </head>
            <body class="bg-white p-4">
              <div class="pdf-container">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid black; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                  <div style="text-align: left; font-size: 0.75rem; width: 48%;">
                    <div style="font-weight: bold; color: #1e3a8a; font-size: 1.125rem;">कंचन मिनरल वाटर</div>
                    <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
                    <div>Ph.: 07422-408555 Mob.: 9425033995</div>
                  </div>
                  <div style="text-align: left; font-size: 0.75rem; width: 48%;">
                    <div style="font-weight: bold; color: #1e3a8a; font-size: 1.125rem;">कंचन चिल्ड वाटर</div>
                    <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
                    <div>Mob.: 9685753343, 9516784779</div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; font-size: 0.875rem; border-bottom: 1px solid black; padding-bottom: 0.25rem; margin-bottom: 0.5rem;">
                  <div>मो.: ${bill.phone_number}</div>
                  <div style="text-align: right;">दिनांक: ${monthName} ${year}</div>
                  <div style="grid-column: span 2;">श्रीमान: ${bill.name}</div>
                </div>

                <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 0.75rem; margin-top: 1rem;">
                  <thead>
                    <tr>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">क्र.</th>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">संख्या</th>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">केन वापसी</th>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">क्र.</th>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">संख्या</th>
                      <th style="border: 1px solid black; padding: 0.25rem; text-align: center;">केन वापसी</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Array.from({ length: 16 }, (_, i) => {
                      const left = ledgerData[i];
                      const right = ledgerData[i + 16];
                      return `
                      <tr>
                        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${i + 1}</td>
                        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${left ? left.delivered_qty : ''}</td>
                        <td style="border: 1px solid black; padding: 0.25rem;"></td>
                        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${i + 17}</td>
                        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;">${right ? right.delivered_qty : ''}</td>
                        <td style="border: 1px solid black; padding: 0.25rem;"></td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid black; margin-top: 0.5rem; padding-top: 0.25rem; font-size: 0.875rem;">
                  <div style="font-size: 0.75rem;">
                    <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
                    <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
                    <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
                  </div>
                  <div class="amount-box">
                    <div>कुल केन: ${totalCans}</div>
                    <div>कुल राशि: ₹${totalAmount}</div>
                  </div>
                </div>
              </div>
            </body>
            </html>
        `;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });
        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${bill.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-bill.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send(`Error generating PDF: ${error.message || error}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// NEW: PDF generation route for order receipts
app.post('/generate-order-receipt', async (req, res) => {
    const { order } = req.body;

    if (!order) {
        return res.status(400).send('Missing order data for receipt generation');
    }

    let browser;
    try {
        const orderDate = new Date(order.order_date).toLocaleDateString('en-IN');
        const deliveryDate = new Date(order.delivery_date).toLocaleDateString('en-IN');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Order Receipt - ${order.customer_name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                body { font-family: sans-serif; margin: 0; padding: 0; }
                .receipt-container {
                    width: 36rem;
                    margin: 0 auto;
                    border: 1px solid black;
                    padding: 1rem;
                    box-sizing: border-box;
                    font-size: 12px;
                }
                .header-section {
                    text-align: center;
                    border-bottom: 2px solid black;
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    padding: 0.25rem 0;
                }
                .total-section {
                    border-top: 2px solid black;
                    padding-top: 1rem;
                    margin-top: 1rem;
                    font-weight: bold;
                }
              </style>
            </head>
            <body class="bg-white p-4">
              <div class="receipt-container">
                <div class="header-section">
                  <div style="font-weight: bold; color: #1e3a8a; font-size: 1.5rem;">कंचन मिनरल वाटर</div>
                  <div style="font-size: 0.9rem; margin-top: 0.5rem;">5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
                  <div style="font-size: 0.9rem;">Ph.: 07422-408555 Mob.: 9425033995</div>
                  <div style="font-weight: bold; margin-top: 1rem; font-size: 1.2rem;">ORDER RECEIPT</div>
                  <div style="font-size: 0.9rem;">Receipt #: ORD-${order.id}</div>
                </div>

                <div class="info-row">
                  <span><strong>Customer Name:</strong></span>
                  <span>${order.customer_name}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Phone:</strong></span>
                  <span>${order.customer_phone}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Address:</strong></span>
                  <span style="text-align: right; max-width: 60%;">${order.customer_address}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Order Date:</strong></span>
                  <span>${orderDate}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Delivery Date:</strong></span>
                  <span>${deliveryDate}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Delivery Time:</strong></span>
                  <span>${order.delivery_time}</span>
                </div>
                
                <div class="info-row">
                  <span><strong>Status:</strong></span>
                  <span style="text-transform: capitalize;">${order.order_status}</span>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="border: 1px solid black; padding: 0.5rem; text-align: left;">Item</th>
                      <th style="border: 1px solid black; padding: 0.5rem; text-align: center;">Qty</th>
                      <th style="border: 1px solid black; padding: 0.5rem; text-align: center;">Rate</th>
                      <th style="border: 1px solid black; padding: 0.5rem; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid black; padding: 0.5rem;">Water Cans (20L)</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">${order.can_qty}</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">₹${order.price_per_can}</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: right;">₹${order.can_qty * order.price_per_can}</td>
                    </tr>
                    ${order.delivery_amount > 0 ? `
                    <tr>
                      <td style="border: 1px solid black; padding: 0.5rem;">Delivery Charges</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">1</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: center;">₹${order.delivery_amount}</td>
                      <td style="border: 1px solid black; padding: 0.5rem; text-align: right;">₹${order.delivery_amount}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                </table>

                <div class="total-section">
                  <div class="info-row">
                    <span>Subtotal:</span>
                    <span>₹${order.can_qty * order.price_per_can}</span>
                  </div>
                  ${order.delivery_amount > 0 ? `
                  <div class="info-row">
                    <span>Delivery Charges:</span>
                    <span>₹${order.delivery_amount}</span>
                  </div>
                  ` : ''}
                  <div class="info-row" style="font-size: 1.1rem; border-top: 1px solid black; padding-top: 0.5rem;">
                    <span>Total Amount:</span>
                    <span>₹${order.total_amount}</span>
                  </div>
                </div>

                ${order.collected_qty > 0 ? `
                <div style="margin-top: 1rem; padding: 0.5rem; background-color: #f0f9ff; border: 1px solid #0ea5e9;">
                  <div class="info-row">
                    <span><strong>Cans Collected:</strong></span>
                    <span>${order.collected_qty} / ${order.can_qty}</span>
                  </div>
                  <div class="info-row">
                    <span><strong>Pending Collection:</strong></span>
                    <span>${order.can_qty - order.collected_qty} cans</span>
                  </div>
                </div>
                ` : ''}

                ${order.notes ? `
                <div style="margin-top: 1rem;">
                  <strong>Notes:</strong>
                  <div style="margin-top: 0.25rem; padding: 0.5rem; background-color: #f9fafb; border: 1px solid #d1d5db;">
                    ${order.notes}
                  </div>
                </div>
                ` : ''}

                <div style="text-align: center; margin-top: 2rem; font-size: 0.9rem; color: #6b7280;">
                  <div>Thank you for your business!</div>
                  <div>For any queries, please contact: 9425033995</div>
                </div>
              </div>
            </body>
            </html>
        `;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
        });
        const page = await browser.newPage();

        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '10mm',
                left: '10mm'
            }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="order-receipt-${order.customer_name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating order receipt:', error);
        res.status(500).send(`Error generating receipt: ${error.message || error}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});