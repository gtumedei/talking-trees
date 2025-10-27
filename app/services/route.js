import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'backend', 'data');
    
    const treesData = fs.readFileSync(path.join(dataDir, 'df.csv'), 'utf8');
    const speciesData = fs.readFileSync(path.join(dataDir, 'df_specie.csv'), 'utf8');
    
    const trees = parseCSV(treesData);
    const species = parseCSV(speciesData);
    
    return NextResponse.json({ trees, species });
  } catch (error) {
    console.error('Error loading CSV files:', error);
    return NextResponse.json(
      { error: 'Failed to load tree data' }, 
      { status: 500 }
    );
  }
}

function parseCSV(csvText) {
  const rows = csvText.split("\n").map(row => row.split("$"));
  const headers = rows[0];
  return rows.slice(1).map(row => 
    Object.fromEntries(row.map((val, i) => [headers[i], val]))
  );
}