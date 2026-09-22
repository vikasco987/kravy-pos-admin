import Tesseract from 'tesseract.js';

if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {};
}
if (typeof (global as any).ImageData === 'undefined') {
    (global as any).ImageData = class ImageData {};
}
if (typeof (global as any).Path2D === 'undefined') {
    (global as any).Path2D = class Path2D {};
}

export async function extractRawTextLocally(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (mimeType.includes("pdf")) {
            const pdfParseModule = require('pdf-parse');
            const parseFn = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;
            const data = await parseFn(buffer);
            return data.text || "";
        } else if (mimeType.includes("image")) {
            // Use Tesseract for images
            const result = await Tesseract.recognize(buffer, 'eng');
            return result.data.text || "";
        }
    } catch (e) {
        console.error("Local OCR failed:", e);
    }
    return "";
}

export function parseMenuLocal(rawText: string): { menu: any[], confidence: number, metrics: any } {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const menuItems: any[] = [];
    
    let currentCategory = "General";
    let foundPrices = 0;
    let validPairs = 0;
    let foundCategories = 0;
    let possibleNoise = 0;
    
    let lastNonPriceLine = "";
    
    // Very basic deterministic parser
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Category heuristic (ALL CAPS and short length)
        if (line === line.toUpperCase() && line.length > 2 && line.length < 30 && !/\d/.test(line)) {
            currentCategory = line;
            foundCategories++;
            lastNonPriceLine = ""; // Reset on category
            continue;
        }
        
        // Match one or more prices separated by slashes at the end of the line
        const priceMatch = line.match(/(?:rs\.?|₹|\$)?\s*(\d{1,4}(?:\.\d{2})?(?:\s*\/\s*\d{1,4}(?:\.\d{2})?)*)\s*$/i);
        
        if (priceMatch) {
            foundPrices++;
            
            // Clean up the name by removing the price portion
            let name = line.replace(/(?:rs\.?|₹|\$)?\s*(\d{1,4}(?:\.\d{2})?(?:\s*\/\s*\d{1,4}(?:\.\d{2})?)*)\s*$/i, '').trim();
            
            // If the name is exactly a variant suffix, it might be a variant of the previous item line
            const isJustVariant = ['small', 'medium', 'large', 's', 'm', 'l', 'half', 'full', 'quarter', 'regular', 'jumbo', '250g', '500g', '1kg', 'basic', 'special', 'premium'].includes(name.toLowerCase());
            if (isJustVariant && lastNonPriceLine) {
                name = `${lastNonPriceLine} ${name}`;
            } else if (!isJustVariant) {
                // If it's a full item with a price, reset the last non-price line
                lastNonPriceLine = "";
            }

            const priceStrings = priceMatch[1].split('/').map(p => p.trim());
            const basePrice = parseFloat(priceStrings[0]);

            let variants: any[] = [];
            if (priceStrings.length > 1) {
                if (priceStrings.length === 2) {
                    variants = [
                        { name: "Half", price: parseFloat(priceStrings[0]) },
                        { name: "Full", price: parseFloat(priceStrings[1]) }
                    ];
                } else {
                    variants = priceStrings.map((p, idx) => ({
                        name: `Size ${idx + 1}`,
                        price: parseFloat(p)
                    }));
                }
            }
            
            // Stricter check for valid names: 
            // 1. Shouldn't be just numbers
            // 2. Should have at least some alphabetical characters
            // 3. Shouldn't contain lots of weird symbols (e.g., %, [, ], =, &, £, |, <, >)
            const hasLetters = /[a-zA-Z]{3,}/.test(name);
            const hasWeirdSymbols = /[%\[\]=&£|<>\\]/.test(name);
            const symbolRatio = (name.match(/[^a-zA-Z0-9\s]/g)?.length || 0) / name.length;
            
            if (name.length > 2 && !/^\d+$/.test(name) && hasLetters && !hasWeirdSymbols && symbolRatio < 0.2) { 
                validPairs++;
                menuItems.push({
                    category: currentCategory,
                    name: name,
                    price: variants.length > 0 ? 0 : basePrice,
                    type: /paneer|veg|aloo|mushroom/i.test(name) ? "veg" : /chicken|mutton|fish/i.test(name) ? "non_veg" : "veg",
                    description: "",
                    variants: variants
                });
            } else {
                possibleNoise++;
            }
        } else {
            // If it's not a category and not a price, it might be a base item name (like "Margherita Pizza")
            if (line.length > 3 && line.length < 50 && /[a-zA-Z]/.test(line)) {
                // Remove numbers (like "1. " from "1. Margherita Pizza")
                lastNonPriceLine = line.replace(/^\d+\.?\s*/, '').trim();
            }
            possibleNoise++;
        }
    }
    
    // Calculate Multi-factor Confidence Score
    // Item/Price pairs: 40% (assuming we want at least 5 pairs for a solid menu)
    const pairScore = Math.min(100, (validPairs / 5) * 100) * 0.40;
    
    // Price validity: 20% (ratio of valid pairs to total prices found)
    const priceScore = foundPrices > 0 ? (validPairs / foundPrices) * 100 * 0.20 : 0;
    
    // Category detection: 15% (did we find any categories?)
    const categoryScore = foundCategories > 0 ? 100 * 0.15 : 0;
    
    // Text quality (noise ratio): 15%
    const totalLines = lines.length || 1;
    const noiseRatio = possibleNoise / totalLines;
    const textQualityScore = Math.max(0, (1 - noiseRatio) * 100) * 0.15;
    
    // Total minimum size bonus: 10%
    const volumeScore = validPairs >= 10 ? 10 : (validPairs >= 5 ? 5 : 0);
    
    const confidenceScore = pairScore + priceScore + categoryScore + textQualityScore + volumeScore;
    
    return {
        menu: menuItems,
        confidence: confidenceScore,
        metrics: { validPairs, foundPrices, foundCategories, textQualityScore }
    };
}
