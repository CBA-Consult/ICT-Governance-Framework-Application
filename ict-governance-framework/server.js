// File: ict-governance-framework/server.js
// Simple Express server to serve the Defender Activities API route

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const defenderActivitiesRoute = require('./api/defender-activities');
const defenderEntitiesRouter = require('./api/defender-entities');
const defenderAlertsRouter = require('./api/defender-alerts');
const defenderFilesRouter = require('./api/defender-files');
const defenderDataEnrichmentRouter = require('./api/defender-dataenrichment');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount the API route
app.use('/api/defender-activities', defenderActivitiesRoute);
app.use('/api/defender-entities', defenderEntitiesRouter);
app.use('/api/defender-alerts', defenderAlertsRouter);
app.use('/api/defender-files', defenderFilesRouter);
app.use('/api/defender-dataenrichment', defenderDataEnrichmentRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
