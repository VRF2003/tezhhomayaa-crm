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
    // 1. Try to load from IndexedDB
    products = await db_products.getAll();
    
    // 2. If no products in DB, fallback to CSV
    if (!products || products.length === 0) {
      console.log("No products in IndexedDB. Fetching from CSV...");
      const response = await fetch('/productss.csv');
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      let headerLineIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Product') && lines[i].includes('Design')) {
          headerLineIndex = i;
          break;
        }
      }
      const cleanCsvText = lines.slice(headerLineIndex).join('\n');

      await new Promise((resolve, reject) => {
        Papa.parse(cleanCsvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            products = results.data.map(row => {
              return {
                productName: row['Product'] || 'Unknown',
                silhouette: row['Silhouette'] || 'Uncategorized',
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
            }).filter(p => p.styleCode !== 'N/A' && p.styleCode !== '');
            resolve();
          },
          error: (err) => {
            console.error("Error parsing CSV:", err);
            reject(err);
          }
        });
      });
      
      // Save parsed CSV products to IndexedDB for future loads
      for (const p of products) {
        await db_products.add(p);
      }
    }
    
    console.log("PRODUCT COUNT:", products.length);
  } catch (error) {
    console.error("Error loading products:", error);
  }
}
