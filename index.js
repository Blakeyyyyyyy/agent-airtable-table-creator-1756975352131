const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = 'appEZQLiRm9cfnVkP'; // Growth AI base

// Logging array to store recent activities
let logs = [];

function addLog(message) {
  const timestamp = new Date().toISOString();
  logs.push({ timestamp, message });
  if (logs.length > 100) logs.shift(); // Keep only last 100 logs
  console.log(`[${timestamp}] ${message}`);
}

app.get('/', (req, res) => {
  res.json({
    status: 'Airtable Table Creator Agent',
    endpoints: [
      'GET / - This status page',
      'GET /health - Health check',
      'GET /logs - View recent logs',
      'POST /create-table - Create the Tasks table',
      'POST /test - Test run'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/logs', (req, res) => {
  res.json({ logs: logs.slice(-20) }); // Return last 20 logs
});

app.post('/create-table', async (req, res) => {
  try {
    addLog('Starting table creation process...');
    
    const tableSchema = {
      name: 'Tasks',
      fields: [
        {
          name: 'Task Name',
          type: 'singleLineText'
        },
        {
          name: 'Description',
          type: 'multilineText'
        },
        {
          name: 'Assigned To',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Blake' },
              { name: 'Beau' },
              { name: 'Racquel' },
              { name: 'Lacy' }
            ]
          }
        },
        {
          name: 'Priority',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Urgent', color: 'redBright' },
              { name: 'High', color: 'orangeBright' },
              { name: 'Medium', color: 'yellowBright' },
              { name: 'Low', color: 'greenBright' }
            ]
          }
        },
        {
          name: 'Status',
          type: 'singleSelect',
          options: {
            choices: [
              { name: 'Not Started', color: 'grayBright' },
              { name: 'In Progress', color: 'yellowBright' },
              { name: 'Review', color: 'orangeBright' },
              { name: 'Completed', color: 'greenBright' },
              { name: 'Blocked', color: 'redBright' }
            ]
          }
        },
        {
          name: 'Due Date',
          type: 'date'
        },
        {
          name: 'Created Date',
          type: 'createdTime'
        },
        {
          name: 'Estimated Hours',
          type: 'number',
          options: {
            precision: 1
          }
        },
        {
          name: 'Actual Hours',
          type: 'number',
          options: {
            precision: 1
          }
        },
        {
          name: 'Progress %',
          type: 'number',
          options: {
            precision: 0
          }
        },
        {
          name: 'Tags',
          type: 'multipleSelects',
          options: {
            choices: [
              { name: 'Development', color: 'blueBright' },
              { name: 'Marketing', color: 'purpleBright' },
              { name: 'Client Work', color: 'greenBright' },
              { name: 'Admin', color: 'grayBright' },
              { name: 'Research', color: 'orangeBright' },
              { name: 'Bug Fix', color: 'redBright' }
            ]
          }
        },
        {
          name: 'Notes',
          type: 'multilineText'
        }
      ]
    };

    addLog('Sending table creation request to Airtable...');
    
    const response = await axios.post(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
      tableSchema,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json'
        }
      }
    );

    addLog(`Table created successfully! Table ID: ${response.data.id}`);
    
    res.json({
      success: true,
      message: 'Tasks table created successfully in Growth AI base!',
      tableId: response.data.id,
      tableName: response.data.name,
      fields: response.data.fields.length
    });

  } catch (error) {
    const errorMsg = `Failed to create table: ${error.response?.data?.error?.message || error.message}`;
    addLog(errorMsg);
    
    res.status(500).json({
      success: false,
      error: errorMsg,
      details: error.response?.data
    });
  }
});

app.post('/test', async (req, res) => {
  try {
    addLog('Running test - checking Airtable connection...');
    
    const response = await axios.get(
      `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_PAT}`
        }
      }
    );

    const existingTables = response.data.tables.map(t => t.name);
    addLog(`Connection successful. Found ${existingTables.length} existing tables`);
    
    res.json({
      success: true,
      message: 'Airtable connection working',
      existingTables,
      ready: !existingTables.includes('Tasks')
    });

  } catch (error) {
    const errorMsg = `Test failed: ${error.message}`;
    addLog(errorMsg);
    
    res.status(500).json({
      success: false,
      error: errorMsg
    });
  }
});

app.listen(port, () => {
  addLog(`Table Creator Agent running on port ${port}`);
});