// src/controllers/authController.js
const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Simple register (creates a customer and stores hashed password in a new field "password")
// NOTE: The Customer model currently does not have a password field. For the purpose of the hackathon,
// we will store the password in a temporary in‑memory map. In a real project you would extend the schema.
const tempPasswords = new Map(); // email -> hashed password

const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required' });
        }
        // Check if customer already exists
        const existing = await prisma.customer.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Customer already exists' });
        }
        // Create customer (no password stored in DB)
        const customer = await prisma.customer.create({
            data: { name: name.trim(), email: email.trim(), phone: phone?.trim() || null },
        });
        const hashed = await bcrypt.hash(password, 10);
        tempPasswords.set(email, hashed);
        const token = jwt.sign({ sub: email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ success: true, token, customer });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const customer = await prisma.customer.findUnique({ where: { email } });
        if (!customer) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const hashed = tempPasswords.get(email);
        if (!hashed) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, hashed);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const token = jwt.sign({ sub: email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, customer });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

module.exports = { register, login };
