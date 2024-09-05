require('dotenv').config();
const express = require('express');
const app = express();

const contactsRouter = require('./routes/contacts');

app.use(express.json());
app.use('/api/contacts', contactsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
