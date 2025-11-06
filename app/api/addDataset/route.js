import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'backend', 'data');
    
    const pollutionData = fs.readFileSync(path.join(dataDir, 'df_inquinanti.csv'), 'utf8');
    const locationData = fs.readFileSync(path.join(dataDir, 'df_comuni.csv'), 'utf8');
  
    const pollution = parseCSV(pollutionData);
    const locations = parseCSV(locationData);
    
    // CORREGGI: restituisci 'locations' invece di 'locationData'
    return NextResponse.json({ pollution, locations });
  } catch (error) {
    console.error('Error loading CSV files:', error);
    return NextResponse.json(
      { error: 'Failed to load tree data' }, 
      { status: 500 }
    );
  }
}

function parseCSV(csvText) {
  const rows = csvText.split("\n").map(row => row.split(","));
  const headers = rows[0];
  return rows.slice(1).map(row => 
    Object.fromEntries(row.map((val, i) => [headers[i], val]))
  );
}