import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CSVRow } from '@service/types/interface_page';

// Tipo generico per rappresentare una riga CSV come oggetto
export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'db');

    const pollutionData = fs.readFileSync(path.join(dataDir, 'df_inquinanti.csv'), 'utf8');
    const locationData = fs.readFileSync(path.join(dataDir, 'df_comuni.csv'), 'utf8');
    const eventData = fs.readFileSync(path.join(dataDir, 'df_event.csv'), 'utf8');

    const pollution: CSVRow[] = parseCSV(pollutionData);
    const locations: CSVRow[] = parseCSV(locationData, '$');
    const events: CSVRow[] = parseCSV(eventData);

    return NextResponse.json({ pollution, locations, events });
  } catch (error) {
    console.error('Error loading CSV files:', error);
    return NextResponse.json(
      { error: 'Failed to load CSV data' },
      { status: 500 }
    );
  }
}

function parseCSV(csvText: string, symbolSplit: string = ","): CSVRow[] {
  const rows = csvText.split("\n").map(row => row.split(symbolSplit));
  const headers = rows[0];
  return rows.slice(1).map(row =>
    Object.fromEntries(row.map((val, i) => [headers[i], val]))
  );
}