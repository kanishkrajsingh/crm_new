    require('dotenv').config();
    const express = require('express');
    const cors = require('cors');
    const customerRoutes = require('./routes/customer.routes');
    const dashboardRoutes = require('./routes/dashboard.routes');
    const orderRoutes = require('./routes/orders.routes');
    const dailyUpdates = require('./routes/daily-update.routes');
    //const productRoutes = require('./routes/product.routes');
    //const orderRoutes = require('./routes/order.routes');
    const pool = require('./database'); // Import the database connection pool

    const app = express();
    const port = process.env.SERVER_PORT || 5000;

    app.use(cors());
    app.use(express.json());

    // Test database connection (optional, but good for initial setup)
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
    //app.use('/api/dashboardRoutes', dashboardRoutes);

    //app.use('/api/products', productRoutes);
   

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });