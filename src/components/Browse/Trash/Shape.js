import express from 'express';
import { XingTaiDB } from '../LoadDatabase.js';

const router = express.Router();

// GET Fac data for a TP
// http://localhost:3000/api/Shape/TP?SM=Sample7&Fac=GeneralSphericity&TP=100
// the range is [min,max,mean,median]
// use in EMBobj.tsx
router.get('/TP', (req, res) => {
    const { SM, TP, Fac } = req.query;

    if (!SM) {
        res.status(400).json({ error: 'SM parameter required' });
        return;
    }
    if (!TP) {
        res.status(400).json({ error: 'TP parameter required' });
        return;
    }
    if (!Fac) {
        res.status(400).json({ error: 'Fac parameter required' });
        return;
    }

    const TableName = SM;

    try {
        const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name = ?";
        const tableExists = XingTaiDB.prepare(tableCheckSql).get(TableName);

        if (!tableExists) {
            res.status(400).json({ error: 'Invalid table name' });
            return;
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error: ' + err.message });
        return;
    }

    try {
        const sql = `SELECT CellName, ${Fac} FROM ${TableName} WHERE TP = ?`;
        const rows = XingTaiDB.prepare(sql).all([TP]);

        const result = {};
        let minValue = Infinity;
        let maxValue = -Infinity;
        const positiveValues = [];

        rows.forEach(row => {
            const factorValue = parseFloat(row[Fac]) || 0;

            if (factorValue > 0) {
                minValue = Math.min(minValue, factorValue);
                positiveValues.push(factorValue);
            }
            maxValue = Math.max(maxValue, factorValue);

            result[row.CellName] = Math.round(factorValue * 100) / 100;
        });

        // Calculate mean
        const mean = positiveValues.length > 0
            ? positiveValues.reduce((sum, v) => sum + v, 0) / positiveValues.length
            : 0;

        // Calculate median
        let median = 0;
        if (positiveValues.length > 0) {
            const sorted = [...positiveValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        result.Range = [
            minValue === Infinity  ? 0 : Math.round(minValue * 100) / 100,
            maxValue === -Infinity ? 0 : Math.round(maxValue * 100) / 100,
            Math.round(mean   * 100) / 100,
            Math.round(median * 100) / 100
        ];

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET Fac data for lineage tree
// http://localhost:3000/Shape/LineageShapeData?SM=WT_Sample6&SMType=CMap8&Fac=HuangShapeFactor
// http://localhost:3000/Shape/LineageShapeData?SM=Sample07&SMType=CShaper17&Fac=HuangShapeFactor
// use in LineageTree.tsx
router.get('/LineageShapeData', (req, res) => {
    const { SM, Fac } = req.query;

    if (!SM) {
        res.status(400).json({ error: 'SM parameter required' });
        return;
    }
    if (!Fac) {
        res.status(400).json({ error: 'Fac parameter required' });
        return;
    }

    const allowedFactors = [
        'Volume',
        'Surface',
        'CoreyShapeFactor',
        'DiameterSphericity',
        'ElongationRatio',
        'GeneralSphericity',
        'HayakawaFlatnessRatio',
        'HayakawaRoundness',
        'HuangShapeFactor',
        'InterceptSphericity',
        'MaximumProjectionSphericity',
        'PivotabilityIndex',
        'SpreadingIndex',
        'WilsonFlatnessIndex'
    ];

    if (!allowedFactors.includes(Fac)) {
        res.status(400).json({ error: 'Invalid shape factor' });
        return;
    }

    const TableName = SM;

    try {
        const sql = `SELECT ID, CellName, TP, ${Fac} FROM ${TableName} ORDER BY TP ASC`;
        const rows = XingTaiDB.prepare(sql).all();

        const result = {};
        let minValue = Infinity;
        let maxValue = -Infinity;
        const positiveValues = [];

        rows.forEach(row => {
            const { ID, CellName, TP } = row;
            const factorValue = parseFloat(row[Fac]) || 0;

            if (factorValue > 0) {
                minValue = Math.min(minValue, factorValue);
                positiveValues.push(factorValue);
            }
            maxValue = Math.max(maxValue, factorValue);

            if (!result[ID]) {
                result[ID] = { CellName };
            }

            result[ID][TP.toString()] = Math.round(factorValue * 100) / 100;
        });

        // Calculate mean
        const mean = positiveValues.length > 0
            ? positiveValues.reduce((sum, v) => sum + v, 0) / positiveValues.length
            : 0;

        // Calculate median
        let median = 0;
        if (positiveValues.length > 0) {
            const sorted = [...positiveValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 !== 0
                ? sorted[mid]
                : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        result.Range = [
            minValue === Infinity  ? 0 : Math.round(minValue * 100) / 100,
            maxValue === -Infinity ? 0 : Math.round(maxValue * 100) / 100,
            Math.round(mean   * 100) / 100,
            Math.round(median * 100) / 100
        ];

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET LineData of a CellName
// http://localhost:3000/Shape/Line?&CellName=ABplppaap&DataName=HuangShapeFactor
// use in MLineChart.tsx
router.get('/Line', (req, res) => {
  let { CellName, DataName } = req.query;

  if (!CellName) {
    res.status(400).json({ error: 'CellName parameter is required' });
    return;
  }
  if (!DataName) {
    res.status(400).json({ error: 'DataName parameter is required' });
    return;
  }

  // Handle array and whitespace
  let cellNameStr = Array.isArray(CellName) ? CellName[0] : CellName;
  cellNameStr = cellNameStr.trim();

  let dataNameStr = Array.isArray(DataName) ? DataName[0] : DataName;
  dataNameStr = dataNameStr.trim();

  const allowedTables = Array.from({ length: 37 }, (_, i) => `Sample${i + 1}`)

  try {
    const tableCheckSql = "SELECT name FROM sqlite_master WHERE type='table' AND name = ?";
    const result = {};

    for (const sampleName of allowedTables) {
      const TableName = sampleName;

      const tableExists = XingTaiDB.prepare(tableCheckSql).get(TableName);
      if (!tableExists) {
        result[sampleName] = [];
        continue;
      }

      // Get all data values ordered by TP
      const getDataSql = `SELECT \`${dataNameStr}\` FROM \`${TableName}\` WHERE CellName = ? ORDER BY CAST(TP AS INTEGER)`;
      const data = XingTaiDB.prepare(getDataSql).all(cellNameStr);

      // Extract and parse values
      result[sampleName] = data.map(row => {
        const val = row[dataNameStr];
        return typeof val === 'string' ? parseFloat(val) : val;
      });
    }

    res.json(result);

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

export default router;
