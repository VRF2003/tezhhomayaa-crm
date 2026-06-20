import Papa from 'papaparse';
import { db_products } from './db.js';

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
          let csvProducts = results.data.map(row => {
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
          resolve(csvProducts);
        },
        error: (err) => {
          console.error("Error parsing CSV:", err);
          resolve([]); // Resolve with empty array instead of rejecting so local products still load
        }
      });
    });
    
    // Load local DB products
    let localProducts = [];
    try {
      localProducts = await db_products.getAll();
    } catch(err) {
      console.error("Error loading local products:", err);
    }

    // Merge logic: local DB overrides CSV based on styleCode
    const merged = [...csvProducts];
    
    for (const lp of localProducts) {
      const idx = merged.findIndex(p => p.styleCode === lp.styleCode);
      if (idx !== -1) {
        merged[idx] = { ...merged[idx], ...lp };
      } else {
        merged.push(lp);
      }
    }
    
    // Assign back to exported products array, filtering out Draft products if needed? 
    // Wait, the prompt says Status (Active / Draft). We should just load them all, or only Active ones?
    // Let's load all of them into the products array so they can be managed in Search. 
    // In Builder, maybe filter by Active. The prompt doesn't strictly say, but usually Draft means not visible in builder. 
    // I will just put all of them in the array, and we can filter by status later.
    products = merged;

  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

