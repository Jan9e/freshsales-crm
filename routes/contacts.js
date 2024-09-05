const express = require('express');
const router = express.Router();
const axios = require('axios');
const mysql = require('mysql2');

// Set up MySQL connection
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Set up FreshSales API client
const FRESHSALES_API_KEY = process.env.FRESHSALES_API_KEY;
const FRESHSALES_DOMAIN = process.env.FRESHSALES_DOMAIN;

const apiClient = axios.create({
    baseURL: `https://${FRESHSALES_DOMAIN}.freshsales.io/api/`,
    headers: {
        'Authorization': `Token token=${FRESHSALES_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// ********** CRUD Endpoints **********

// Create a new contact (POST request)
router.post('/createContact', async (req, res) => {
    const { first_name, last_name, email, mobile_number, data_store } = req.body;

    if (data_store === 'CRM') {
        try {
            const response = await apiClient.post('contacts', { contact: { first_name, last_name, email, mobile_number } });
            res.status(201).json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Error creating contact in FreshSales CRM', error });
        }
    } else if (data_store === 'DATABASE') {
        const sql = `INSERT INTO contacts (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)`;
        db.query(sql, [first_name, last_name, email, mobile_number], (err, result) => {
            if (err) throw err;
            res.status(201).json({ id: result.insertId, first_name, last_name, email, mobile_number });
        });
    } else {
        res.status(400).json({ message: "Invalid 'data_store' value. Must be 'CRM' or 'DATABASE'." });
    }
});

// Retrieve a contact (POST request)
router.post('/getContact', async (req, res) => {
    const { contact_id, data_store } = req.body;

    if (data_store === 'CRM') {
        try {
            const response = await apiClient.get(`contacts/${contact_id}`);
            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Error retrieving contact from FreshSales CRM', error });
        }
    } else if (data_store === 'DATABASE') {
        const sql = `SELECT * FROM contacts WHERE id = ?`;
        db.query(sql, [contact_id], (err, result) => {
            if (err) throw err;
            res.status(200).json(result[0]);
        });
    } else {
        res.status(400).json({ message: "Invalid 'data_store' value. Must be 'CRM' or 'DATABASE'." });
    }
});

// Update a contact (PUT request)
router.put('/updateContact', async (req, res) => {
    const { contact_id, new_email, new_mobile_number, data_store } = req.body;

    if (data_store === 'CRM') {
        try {
            const response = await apiClient.put(`contacts/${contact_id}`, { contact: { email: new_email, mobile_number: new_mobile_number } });
            res.status(200).json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Error updating contact in FreshSales CRM', error });
        }
    } else if (data_store === 'DATABASE') {
        const sql = `UPDATE contacts SET email = ?, phone = ? WHERE id = ?`;
        db.query(sql, [new_email, new_mobile_number, contact_id], (err, result) => {
            if (err) throw err;
            res.status(200).json({ message: 'Contact updated successfully', new_email, new_mobile_number });
        });
    } else {
        res.status(400).json({ message: "Invalid 'data_store' value. Must be 'CRM' or 'DATABASE'." });
    }
});

// Delete a contact (DELETE request)
router.delete('/deleteContact', async (req, res) => {
    const { contact_id, data_store } = req.body;

    if (data_store === 'CRM') {
        try {
            await apiClient.delete(`contacts/${contact_id}`);
            res.status(204).json({ message: 'Contact deleted successfully from FreshSales CRM' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting contact from FreshSales CRM', error });
        }
    } else if (data_store === 'DATABASE') {
        const sql = `DELETE FROM contacts WHERE id = ?`;
        db.query(sql, [contact_id], (err, result) => {
            if (err) throw err;
            res.status(204).json({ message: 'Contact deleted successfully from MySQL database' });
        });
    } else {
        res.status(400).json({ message: "Invalid 'data_store' value. Must be 'CRM' or 'DATABASE'." });
    }
});

module.exports = router;
