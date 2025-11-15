// app/api/findTreeByCoordinates/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');

    const dataDir = path.join(process.cwd(), 'public', 'db');
    const treesData = fs.readFileSync(path.join(dataDir, 'df.csv'), 'utf8');
    const speciesData = fs.readFileSync(path.join(dataDir, 'df_specie.csv'), 'utf8');

    const trees = parseCSV(treesData);
    const species = parseCSV(speciesData);

    const foundTree = trees.find((t) => {
      const treeLat = parseFloat(t.lat);
      const treeLng = parseFloat(t.lon);
      if (isNaN(treeLat) || isNaN(treeLng)) return false;

      const dx = (treeLat - lat) * 111000;
      const dy = (treeLng - lng) * 85000;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 200;
    }) || null;

    const foundSpecies =
      foundTree && foundTree.index_specie ? species[parseInt(foundTree.index_specie)] || null : null;

    console.log(foundSpecies)

    return NextResponse.json({ tree: foundTree, species: foundSpecies });
  } catch (err) {
    console.error('Error finding tree:', err);
    return NextResponse.json({ error: 'Failed to find tree' }, { status: 500 });
  }
}

function parseCSV(csvText: string) {
  const rows = csvText.split("\n").map(row => row.split("$"));
  const headers = rows[0];
  return rows.slice(1).map(row => 
    Object.fromEntries(row.map((val, i) => [headers[i], val]))
  );
}


/*import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'df');
    
    const treesData = fs.readFileSync(path.join(dataDir, 'df.csv'), 'utf8');
    const speciesData = fs.readFileSync(path.join(dataDir, 'df_specie.csv'), 'utf8');
    
    const trees = parseCSV(treesData);
    const species = parseCSV(speciesData);
    
    return NextResponse.json({ trees, species});
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
}*/