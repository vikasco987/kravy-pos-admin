const variantSuffixes = ['small', 'medium', 'large', 's', 'm', 'l', 'half', 'full', 'quarter', 'regular', 'jumbo', '250g', '500g', '1kg'];

function normalizeVariants(menu) {
    const finalMenu = [];
    let lastBaseItem = null;
    
    for (const item of menu) {
        if (item.variants && item.variants.length > 0) {
            finalMenu.push(item);
            lastBaseItem = item;
            continue;
        }

        let isVariant = false;
        let baseName = item.name || "";
        let variantName = "";
        let matchedSuffix = "";
        
        for (const suffix of variantSuffixes) {
            // Check for EXACT suffix match (e.g. "Small")
            const exactRegex = new RegExp(`^(${suffix})(?:\\s*\\))?$`, 'i');
            const exactMatch = item.name.trim().match(exactRegex);
            
            if (exactMatch && lastBaseItem) {
                baseName = lastBaseItem.name;
                variantName = exactMatch[1].trim();
                isVariant = true;
                matchedSuffix = suffix;
                break;
            }
            
            // Check for suffix with separator (e.g. "Pizza - Small")
            const regex = new RegExp(`[\\s\\-_\\(]+(${suffix})(?:\\s*\\))?\\s*$`, 'i');
            const match = item.name.match(regex);
            if (match) {
                const potentialBase = item.name.replace(regex, '').trim();
                if (potentialBase.length > 1) {
                    baseName = potentialBase;
                    variantName = match[1].trim();
                    isVariant = true;
                    matchedSuffix = suffix;
                    break;
                }
            }
        }
        
        if (isVariant) {
            // Find if we already have this base item in finalMenu
            const existingItem = finalMenu.find(i => i.name.toLowerCase() === baseName.toLowerCase() && i.category === item.category);
            
            if (existingItem) {
                if (!existingItem.variants) existingItem.variants = [];
                // If it's a new variant array, and the existing item had a base price, maybe we should push it as a variant?
                // Wait, if it was just a label, price is 0. If it had a price, it might be a default variant.
                existingItem.variants.push({
                    name: variantName,
                    price: item.price
                });
                
                // If the existing item had a non-zero price and we just added the first variant, 
                // we might want to preserve the base price, or clear it if it's meant to be 0.
                // For now, leave it.
                lastBaseItem = existingItem;
            } else {
                // If base item doesn't exist, create it!
                const newItem = {
                    name: baseName,
                    category: item.category,
                    type: item.type,
                    description: item.description,
                    price: 0, // Base price 0 since all variants will have prices
                    variants: [{
                        name: variantName,
                        price: item.price
                    }]
                };
                finalMenu.push(newItem);
                lastBaseItem = newItem;
            }
        } else {
            finalMenu.push(item);
            lastBaseItem = item;
        }
    }
    
    return finalMenu;
}

const inputMenu = [
  { name: "Margherita Pizza", price: 0, category: "Pizza" },
  { name: "Small", price: 199, category: "Pizza" },
  { name: "Medium", price: 299, category: "Pizza" },
  { name: "Large", price: 399, category: "Pizza" },
  { name: "Farmhouse Pizza Small", price: 250, category: "Pizza" },
  { name: "Farmhouse Pizza Medium", price: 350, category: "Pizza" }
];

console.log(JSON.stringify(normalizeVariants(inputMenu), null, 2));
