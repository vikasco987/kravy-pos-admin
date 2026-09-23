const variantSuffixes = ['small', 'medium', 'large', 's', 'm', 'l', 'half', 'full', 'quarter', 'regular', 'jumbo', '250g', '500g', '1kg'];

function normalizeVariants(menu) {
    const finalMenu = [];
    const grouped = new Map();
    let lastBaseItem = null;
    let fallbackBaseName = "";
    
    for (const item of menu) {
        if (item.variants && item.variants.length > 0) {
            finalMenu.push({ type: 'normal', item });
            lastBaseItem = item;
            fallbackBaseName = item.name;
            continue;
        }

        let isVariant = false;
        let baseName = item.name || "";
        let variantName = "";
        
        for (const suffix of variantSuffixes) {
            // Check for EXACT suffix match (e.g. "Small")
            const exactRegex = new RegExp(`^(${suffix})(?:\\s*\\))?$`, 'i');
            const exactMatch = item.name.trim().match(exactRegex);
            
            if (exactMatch && fallbackBaseName) {
                baseName = fallbackBaseName;
                variantName = exactMatch[1].trim();
                isVariant = true;
                break;
            }
            
            // Check for suffix with separator (e.g. "Pizza - Small" or "Pizza Small")
            const regex = new RegExp(`[\\s\\-_\\(]+(${suffix})(?:\\s*\\))?\\s*$`, 'i');
            const match = item.name.match(regex);
            if (match) {
                const potentialBase = item.name.replace(regex, '').trim();
                if (potentialBase.length > 1) {
                    baseName = potentialBase;
                    variantName = match[1].trim();
                    isVariant = true;
                    break;
                }
            }
        }
        
        if (isVariant) {
            const catKey = (item.category || "Uncategorized").trim().toLowerCase();
            const mapKey = `${catKey}::${baseName.toLowerCase()}`;
            
            if (!grouped.has(mapKey)) {
                grouped.set(mapKey, { 
                    baseName: baseName, 
                    category: item.category, 
                    type: item.type, 
                    description: item.description, 
                    items: [] 
                });
            }
            grouped.get(mapKey).items.push({ originalItem: item, variantName });
            // Even if it's a variant, it might be a false positive, so update fallback
            fallbackBaseName = baseName;
        } else {
            finalMenu.push({ type: 'normal', item });
            fallbackBaseName = item.name;
        }
    }
    
    // Now resolve grouped items
    const resolvedMenu = [];
    
    // Convert finalMenu into a map for fast lookup of standalone base items
    const baseItemMap = new Map();
    for (const entry of finalMenu) {
        if (entry.type === 'normal') {
            const catKey = (entry.item.category || "Uncategorized").trim().toLowerCase();
            const mapKey = `${catKey}::${(entry.item.name || "").toLowerCase()}`;
            if (!baseItemMap.has(mapKey)) {
                baseItemMap.set(mapKey, []);
            }
            baseItemMap.get(mapKey).push(entry);
        }
    }

    for (const [mapKey, group] of grouped.entries()) {
        const matchingBaseEntries = baseItemMap.get(mapKey) || [];
        
        // If we found multiple variants OR we found a matching base item without variants
        if (group.items.length > 1 || matchingBaseEntries.length > 0) {
            
            let baseItemToMutate = null;
            if (matchingBaseEntries.length > 0) {
                // Merge into the first matching base item
                baseItemToMutate = matchingBaseEntries[0].item;
                matchingBaseEntries[0].type = 'merged'; // Mark as merged so we don't output it twice if we wanted to (but we output finalMenu as is)
            } else {
                // Create a new base item
                baseItemToMutate = {
                    name: group.baseName,
                    category: group.category,
                    type: group.type,
                    description: group.description,
                    price: group.items[0].originalItem.price,
                };
                resolvedMenu.push(baseItemToMutate);
            }
            
            if (!baseItemToMutate.variants) baseItemToMutate.variants = [];
            
            for (const vItem of group.items) {
                baseItemToMutate.variants.push({
                    name: vItem.variantName,
                    price: vItem.originalItem.price
                });
            }
        } else {
            // Low confidence: only 1 variant matched, and no base item found. Just keep original.
            resolvedMenu.push(group.items[0].originalItem);
        }
    }
    
    for (const entry of finalMenu) {
        resolvedMenu.push(entry.item);
    }
    
    return resolvedMenu;
}

const inputMenu = [
  { name: "Margherita Pizza", price: 0, category: "Pizza" },
  { name: "Small", price: 199, category: "Pizza" },
  { name: "Medium", price: 299, category: "Pizza" },
  { name: "Large", price: 399, category: "Pizza" },
  { name: "Farmhouse Pizza Small", price: 250, category: "Pizza" },
  { name: "Farmhouse Pizza Medium", price: 350, category: "Pizza" },
  { name: "Coke - Small", price: 40, category: "Drink" }
];

console.log(JSON.stringify(normalizeVariants(inputMenu), null, 2));
