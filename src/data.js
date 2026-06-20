import Papa from 'papaparse';

export let products = [];

export const getUniqueValues = (key) => [...new Set(products.map(p => p[key]).filter(Boolean))].sort();

function parseNumber(val) {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.-]+/g,""));
  return isNaN(num) ? 0 : num;
}

export async function loadProducts() {
  try {
    const response = await fetch('/productss.csv');
    const csvText = await response.text();
    
    // The CSV has 3 empty header lines (,,,,,,,,,,,,) at the top. We need to skip them.
    // PapaParse can skip empty lines, but commas-only lines might be treated as empty or columns of empty strings.
    // Let's clean the top of the CSV text before parsing to ensure the header row is the first line.
    const lines = csvText.split('\n');
    let headerLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Product') && lines[i].includes('Design')) {
        headerLineIndex = i;
        break;
      }
    }
    const cleanCsvText = lines.slice(headerLineIndex).join('\n');

    return new Promise((resolve, reject) => {
      Papa.parse(cleanCsvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          products = results.data.map(row => {
            return {
              productName: row['Product'] || 'Unknown',
              design: row['Design'] || 'N/A',
              colour: row['Colour'] || 'N/A',
              styleCode: row['Style Code'] || 'N/A',
              category: row['Cateogry '] || row['Category'] || 'N/A',
              fabric: row['Fabric'] || 'N/A',
              cost: parseNumber(row['Costing With Admin']),
              finalCost: parseNumber(row['Admin With Logistics Cost']),
              retailPrice: parseNumber(row['Retail Price']),
              wholesale50: parseNumber(row['Wholesale Price - 50% Off']),
              wholesale40: parseNumber(row['Wholesale Price - 40% Off']),
              wholesale30: parseNumber(row['Wholesale Price - 30% Off'])
            };
          }).filter(p => p.styleCode !== 'N/A' && p.styleCode !== ''); // Filter out completely empty parsed rows
          resolve();
        },
        error: (err) => {
          console.error("Error parsing CSV:", err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error("Error fetching products.csv:", error);
  }
}
