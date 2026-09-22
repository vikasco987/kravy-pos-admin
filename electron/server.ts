import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import axios from 'axios';
import * as xlsx from 'xlsx';
import { extractRawTextLocally, parseMenuLocal } from './localOcr';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') }); // For dev
dotenv.config(); // fallback

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const app = express();
const port = 15432;

// --- DIAGNOSTIC LOGGER ---
const fs = require('fs');
const os = require('os');
const logFile = path.join(os.homedir(), 'kravy_backend_log.txt');
function writeLog(msg: string) {
  try {
    const time = new Date().toISOString();
    fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
    console.log(msg);
  } catch (e) {}
}

process.on('uncaughtException', (err) => {
  writeLog(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
});
process.on('unhandledRejection', (reason, promise) => {
  writeLog(`UNHANDLED REJECTION: ${reason}`);
});

writeLog(`Server script loaded. DATABASE_URL is ${process.env.DATABASE_URL ? 'SET' : 'UNDEFINED'}`);

app.use((req, res, next) => {
  if (req.path.includes('/login')) {
    writeLog(`Incoming request: ${req.method} ${req.path}`);
  }
  next();
});
// -------------------------
const JWT_SECRET = process.env.JWT_SECRET || "kravy_pos_secret_key_123";

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: "Missing fields" });

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { phone: cleanIdentifier },
          { phone: { endsWith: cleanIdentifier.length >= 10 ? cleanIdentifier.slice(-10) : cleanIdentifier } },
          { secondaryEmails: { has: cleanIdentifier } }
        ],
        isDisabled: false
      }
    });

    if (!user) return res.status(401).json({ error: "User not found" });
    if (!user.isVerified) return res.status(403).json({ error: "Not verified", notVerified: true, email: user.email });

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) return res.status(401).json({ error: "Incorrect Password" });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, clerkId: user.clerkId },
      JWT_SECRET,
      { expiresIn: "90d" }
    );

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, clerkId: user.clerkId },
      token
    });
  } catch (error: any) {
    console.error("LOGIN_ERROR:", error);
    res.status(500).json({ error: `Login failed: ${error?.message || "Unknown error"}` });
  }
});

// Menu AI OCR Engine
app.post('/api/menu/upload-ocr', upload.any(), async (req, res) => {
    try {
        const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No menu files uploaded." });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "GEMINI_API_KEY / GOOGLE_API_KEY is not configured in the server's .env file." });
        }

        let inlineDataParts: any[] = [];
        let excelTextParts: any[] = [];
        let firstFileName = files[0].originalname;

        for (const file of files) {
            const buffer = file.buffer;
            let mimeType = file.mimetype;
            const fileName = file.originalname.toLowerCase();
            const base64Data = buffer.toString("base64");

            console.log(`[Menu AI OCR Engine] Processing uploaded file: Name = ${file.originalname}, Mime = ${mimeType}, Size = ${buffer.byteLength} bytes`);

            if (mimeType.includes("spreadsheetml") || mimeType.includes("excel") || mimeType.includes("csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
                console.log("Detected Excel/CSV file! Parsing with xlsx package before sending to Gemini...");
                const workbook = xlsx.read(buffer, { type: "buffer" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const csvData = xlsx.utils.sheet_to_csv(worksheet);
                excelTextParts.push({ text: "Here is the parsed spreadsheet content in CSV format for file " + fileName + ":\n" + csvData });
            } else if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
                console.log("Detected Word document! Parsing with mammoth before sending to Gemini...");
                try {
                    const mammoth = require("mammoth");
                    const docxResult = await mammoth.extractRawText({ buffer });
                    excelTextParts.push({ text: "Here is the parsed Word document content for file " + fileName + ":\n" + docxResult.value });
                } catch (e) {
                    console.error("Mammoth failed to load or parse:", e);
                    excelTextParts.push({ text: "Failed to parse word document: " + fileName });
                }
            } else {
                let actualMime = mimeType;
                if (!actualMime || actualMime === "application/octet-stream") {
                    if (fileName.endsWith(".pdf")) actualMime = "application/pdf";
                    else if (fileName.endsWith(".png")) actualMime = "image/png";
                    else if (fileName.endsWith(".webp")) actualMime = "image/webp";
                    else actualMime = "image/jpeg";
                }
                mimeType = actualMime; // update for later
                inlineDataParts.push({
                    inlineData: {
                        mimeType: actualMime,
                        data: base64Data
                    }
                });
            }
        }

        console.log(`[Menu AI OCR Engine] Starting Local OCR extraction...`);
        let localRawText = "";
        
        for (const file of files) {
            let mimeType = file.mimetype;
            const fileName = file.originalname.toLowerCase();
            
            if (mimeType.includes("spreadsheetml") || mimeType.includes("excel") || mimeType.includes("csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")) {
                const workbook = xlsx.read(file.buffer, { type: "buffer" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                localRawText += "\n" + xlsx.utils.sheet_to_csv(worksheet);
            } else if (mimeType.includes("wordprocessingml") || mimeType.includes("msword") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
                try {
                    const mammoth = require("mammoth");
                    const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
                    localRawText += "\n" + docxResult.value;
                } catch(e) {}
            } else {
                let actualMime = mimeType;
                if (!actualMime || actualMime === "application/octet-stream") {
                    if (fileName.endsWith(".pdf")) actualMime = "application/pdf";
                    else if (fileName.endsWith(".png")) actualMime = "image/png";
                    else if (fileName.endsWith(".webp")) actualMime = "image/webp";
                    else actualMime = "image/jpeg";
                }
                const extracted = await extractRawTextLocally(file.buffer, actualMime);
                localRawText += "\n" + extracted;
            }
        }
        
        if (localRawText.trim()) {
             const localParseResult = parseMenuLocal(localRawText);
             console.log(`[Menu AI OCR Engine] Local Parser Confidence: ${localParseResult.confidence}%`, localParseResult.metrics);
             
             if (localParseResult.confidence >= 75) {
                 console.log(`[Menu AI OCR Engine] High confidence (${localParseResult.confidence}%)! Skipping AI fallback.`);
                 return res.json({
                     success: true,
                     source: "local",
                     confidence: localParseResult.confidence,
                     restaurantName: "Local OCR Extracted Menu",
                     address: "Delhi NCR",
                     timings: "11:00 AM - 11:00 PM",
                     phone: "9999999999",
                     menu: normalizeVariants(localParseResult.menu)
                 });
             } else {
                 console.log(`[Menu AI OCR Engine] Low confidence (${localParseResult.confidence}%). Falling back to AI...`);
             }
        } else {
             console.log(`[Menu AI OCR Engine] Local OCR failed or returned empty. Falling back to AI...`);
        }

        const modelsToTry = [
            "gemini-1.5-pro-latest",
            "gemini-3.6-flash",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest"
        ];

        const languagePref = req.body.languagePref || "english";
        let languageRule = `5. TRANSLATE & TRANSLITERATE TO ENGLISH: If the menu contains regional script (Devanagari/Hindi/Marathi, etc.), you MUST translate or transliterate it strictly to standard English alphabet characters (e.g. 'Roti', 'Misal Pav', 'Chai'). Do NOT output non-English regional scripts. Every single word in 'restaurantName', 'category', 'name', and 'description' MUST consist strictly of plain English text, numbers, standard spaces, brackets, and punctuation. Do not use special characters or non-English scripts, as thermal printers fail to print them.`;
        if (languagePref === "dual") {
            languageRule = `5. ENGLISH & NATIVE BILINGUAL NAMES: The menu items must be outputted with their English name followed immediately by the native/regional script name (e.g. Hindi, Marathi, Gujarati, Tamil, etc., whichever is present in the document), separated by a single space. DO NOT USE BRACKETS for the native name! Brackets break the thermal printer. Example: 'Masala Sandwich मसाला सैंडविच' or 'Misal Pav मिसळ पाव'. DO NOT output 'Misal Pav (मिसळ पाव)'. Ensure the spelling is accurate in both languages.`;
        } else if (languagePref === "arabic") {
            languageRule = `5. ENGLISH & ARABIAN BILINGUAL NAMES: The menu items must be outputted with their English name followed immediately by the Arabic script name, separated by a single space. DO NOT USE BRACKETS for the Arabic name! Brackets break the thermal printer. Example: 'Chicken Mandi مندي دجاج' or 'Hummus حمص'. DO NOT output 'Hummus (حمص)'. Ensure the spelling is accurate in both languages.`;
        }

        const prompt = `
You are a highly advanced AI system designed to digitize menus and product catalogs from images, PDFs, and parsed spreadsheet data with elite precision.
Your job is to read this document and extract EVERY single item with 100% precision.

CRITICAL INSTRUCTION: First, determine if this document is a FOOD menu (Restaurant/Cafe) OR a RETAIL/GENERAL product catalog (e.g. Hardware, Grocery, Electronics, Clothing).

Also, please search the top/header/footer of the document to extract the business contact details if present: Please return a structured JSON response using ultra-short keys to save output tokens. MATCH EXACTLY this structure:
{
  "r": "Business Name",
  "a": "Address",
  "ti": "Timings",
  "ph": "Phone",
  "m": [
    {
      "c": "Category Name",
      "n": "Item Name",
      "p": 250,
      "t": "Pure Veg",
      "d": "Description if any",
      "v": [
        { "name": "Half", "price": 150 },
        { "name": "Full", "price": 250 }
      ]
    }
  ]
}

Strictly follow these rules:
1. Return ONLY the raw JSON object. Do not add any conversational text.
2. Group items under correct categories.
3. Normalize all spelling and format.
4. CRITICAL RULE ON VARIANTS & COLUMNS:
Menus often have tabular layouts where sizes are in columns. You MUST map prices to their correct rows and group variants correctly!
Example Column Input:
                 Small  Medium  Large
Pizza Margherita 199    299     399
Pizza Farmhouse  250    350     450

Expected Output MUST NOT split items. It MUST be:
[
  {"n": "Pizza Margherita", "v": [{"name": "Small", "price": 199}, {"name": "Medium", "price": 299}, {"name": "Large", "price": 399}]},
  {"n": "Pizza Farmhouse", "v": [{"name": "Small", "price": 250}, {"name": "Medium", "price": 350}, {"name": "Large", "price": 450}]}
]
Do NOT create items like "Pizza Margherita Small" or mix prices between rows. Group all sizes/variants (S/M/L, Half/Full, 250g/500g, etc.) under the correct parent item.
5. If two completely different items have their own names (e.g. "Pizza Margherita" and "Pizza Farmhouse"), treat them as separate items, NOT variants of "Pizza".
6. DO NOT INVENT PRICES. If a price is missing from the menu, do not set it to 0. Leave it empty/null.
${languageRule}
6. EXTREME IMPORTANCE: DO NOT SKIP ANY ITEMS. YOU MUST EXTRACT EVERY SINGLE ROW, NO MATTER HOW LONG THE DOCUMENT IS. NEVER TRUNCATE.
7. THIS DOCUMENT CONTAINS MULTIPLE PAGES (often 10+ pages). You MUST read through EVERY single page from start to finish.
8. Items that say "APS" or have no numeric price must be extracted as well. Just set "p": 0 for them.
9. To save tokens and avoid truncation, do NOT include any white space or newlines in the JSON output. Make it a single, continuous string.
`;

        const parseOnly = req.query.parseOnly === "true";

        if (parseOnly) {
            const partsArray = [{ text: prompt }];
            partsArray.push(...excelTextParts);
            partsArray.push(...inlineDataParts);
            
            console.log(`[Menu AI OCR Engine] Fast parsing complete. Returning payload to frontend for client-side processing.`);
            return res.json({
                success: true,
                partsArray: partsArray
            });
        }

        let textResponse = "";
        let selectedModel = "";
        let lastError = null;
        
        const apiKeys = apiKey.split(',').map((k: string) => k.trim());

        for (const model of modelsToTry) {
            for (const currentKey of apiKeys) {
                let attempt = 0;
                const maxRetries = 3;
                
                while (attempt <= maxRetries) {
                    try {
                        console.log(`[Menu AI OCR Engine] Trying model: ${model} with key ${currentKey.substring(0, 5)}... attempt ${attempt}`);
                        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;

                        const partsArray = [{ text: prompt }];
                        partsArray.push(...excelTextParts);
                        partsArray.push(...inlineDataParts);

                        const response = await axios.post(geminiUrl, {
                            contents: [{ parts: partsArray }],
                            generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 }
                        }, {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 300000
                        });

                        textResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textResponse) {
                            selectedModel = model;
                            console.log(`[Menu AI OCR Engine] Successfully retrieved response using model: ${selectedModel}`);
                            break; // Break retry loop
                        }
                    } catch (err: any) {
                        const status = err.response?.status;
                        const isRetryable = status === 429 || status === 503 || status === 500;
                        const errMsg = err.response?.data?.error?.message || err.message;
                        lastError = err;
                        
                        if (isRetryable) {
                            if (attempt === maxRetries) {
                                console.warn(`[Menu OCR AI Engine] Model ${model} returned ${status} exceeded after max retries.`);
                                break; // Break retry loop, move to next key/model
                            }
                            const delay = Math.min(60000, 5000 * Math.pow(2, attempt));
                            console.warn(`[Menu OCR AI Engine] ${status} received for ${model}. Retrying in ${delay / 1000}s...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            attempt++;
                            continue;
                        }
                        
                        console.warn(`[Menu OCR AI Engine] Model ${model} failed: ${errMsg}`);
                        break; // Break retry loop on non-retryable error
                    }
                }
                if (textResponse) break; // Break API key loop
            }
            if (textResponse) break; // Break model loop
        }

        if (!textResponse) {
            const finalErrorMsg = lastError?.response?.data || lastError?.message || "No response content from any Gemini OCR model.";
            console.error("[Menu OCR AI Engine] All models failed in fallback chain.");
            return res.status(500).json({ error: `All Gemini OCR models failed or exceeded quota. Last error: ${JSON.stringify(finalErrorMsg)}` });
        }

        // Parse AI JSON response and apply the smart grouping logic
        let parsedMenu;
        try {
            let cleanText = textResponse.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
            if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
            if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
            
            cleanText = cleanText.replace(/[\n\r\t]+/g, ' ');
            cleanText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            
            parsedMenu = JSON.parse(cleanText);
        } catch (parseErr: any) {
            console.warn("[Menu OCR AI Engine] JSON parse failed, attempting auto-repair...", parseErr);
            let cleanText = textResponse.replace(/[\n\r]+/g, ' ');
            cleanText = cleanText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
            let repaired = cleanText.replace(/,[^,]*$/, ''); 
            
            const closingOptions = [']', '}]', ']}', ']}]}', '}', '}}', '}]}'];
            let success = false;
            
            for (const closing of closingOptions) {
                try {
                    parsedMenu = JSON.parse(repaired + closing);
                    success = true;
                    break;
                } catch(e) {}
            }
            
            if (!success) {
                repaired = repaired.replace(/,[^,]*$/, '');
                for (const closing of closingOptions) {
                    try {
                        parsedMenu = JSON.parse(repaired + closing);
                        success = true;
                        break;
                    } catch(e) {}
                }
            }
            
            if (!success) {
                const lastBrace = textResponse.lastIndexOf('}');
                if (lastBrace !== -1) {
                    let aggressiveRepair = textResponse.substring(0, lastBrace + 1);
                    for (const closing of closingOptions) {
                        try {
                            parsedMenu = JSON.parse(aggressiveRepair + closing);
                            success = true;
                            break;
                        } catch(e) {}
                    }
                }
            }
            
            if (!success) {
                console.error("Failed to parse and repair JSON response from Gemini.");
                return res.status(500).json({ error: "Failed to parse and repair JSON response from AI." });
            }
        }
        let menuItems = (parsedMenu.m || parsedMenu.menu || []).map((item: any) => ({
            category: item.c || item.category || "Uncategorized",
            name: item.n || item.name || "Unnamed Item",
            price: item.p || item.price || 0,
            type: item.t || item.type || "Pure Veg",
            description: item.d || item.description || "",
            variants: item.v || item.variants || []
        }));

        console.log(`[Menu AI OCR Engine] Extracted ${menuItems.length} items successfully for ${parsedMenu.r || parsedMenu.restaurantName} using model ${selectedModel}!`);
        return res.json({
            success: true,
            source: "ai-fallback",
            confidence: 100, // AI is highly confident by definition for now
            restaurantName: parsedMenu.r || parsedMenu.restaurantName || "AI Scraped Restaurant",
            address: parsedMenu.a || parsedMenu.address || "Delhi NCR",
            timings: parsedMenu.ti || parsedMenu.timings || "11:00 AM - 11:00 PM",
            phone: parsedMenu.ph || parsedMenu.phone || "9999999999",
            menu: normalizeVariants(menuItems)
        });

    } catch (e: any) {
        console.error("[Menu OCR AI Engine] Failed:", e.response?.data || e.message);
        return res.status(500).json({ error: e.message, details: e.response?.data || null });
    }
});


// Add /api/menu/get-keys route because AutoApply needs it
app.get('/api/menu/get-keys', (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY });
});


// Process AI extracted menu data
app.post("/api/menu/post-process", express.json(), (req, res) => {
    try {
        const parsedMenu = req.body;
        let menuItems = parsedMenu.menu || [];
        res.json({ success: true, menu: normalizeVariants(menuItems), original: parsedMenu });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
const isSafeFoodUrl = (url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const lower = url.toLowerCase();
    const nsfwKeywords = [
        "nude", "naked", "sex", "porn", "adult", "bikini", "boob", "breast",
        "erotic", "model", "girl", "woman", "body", "underwear", "lingerie",
        "person", "human", "face", "portrait"
    ];
    if (nsfwKeywords.some(kw => lower.includes(kw))) return false;
    return true;
};

app.get('/api/proxy/image-search', async (req, res) => {
    try {
        const query = req.query.q as string;
        if (!query) {
            return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
        }
        const limit = (req.query.limit as string) || "12";
        const page = (req.query.page as string) || "1";
        
        const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        
        const response = await fetch(foodSnapUrl);
        if (!response.ok) {
            throw new Error(`FoodSnap API error: ${response.statusText}`);
        }
        const data = await response.json();
        return res.json(data);
    } catch (error: any) {
        console.error("Image Search Proxy Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/proxy/google-image-search', async (req, res) => {
    try {
        const query = req.query.q as string;
        const offset = (req.query.offset as string) || "0";
        
        if (!query) {
            return res.status(400).json({ success: false, error: "Query parameter 'q' is required." });
        }

        const cleanName = query.replace(/\(.*\)|\{.*\}|\[.*\]|\d+\s*ml|\d+\s*lit/gi, "").trim();
        let photos: any[] = [];

        const beverageKeywords = ['tea', 'coffee', 'chai', 'pepsi', 'coke', 'coca-cola', 'cola', 'drink', 'juice', 'shake', 'lassi', 'mocktail', 'cocktail', 'cold drink', 'soda', 'water', 'limca', 'sprite', 'fanta', 'dew', 'thumbs up'];
        const isBeverage = beverageKeywords.some(k => cleanName.toLowerCase().includes(k));
        const isPizza = cleanName.toLowerCase().includes('pizza');
        
        let searchTerms = isBeverage
            ? `${cleanName} drink beverage glass`
            : `${cleanName} dish food recipe`;
        if (isPizza) {
            searchTerms = `${cleanName} italian pizza food`;
        }
        
        const searchQ = `${searchTerms}`;
        
        try {
            const res1 = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(searchQ)}&kp=1`, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
            });
            const html = await res1.text();
            const vqdMatch = html.match(/vqd=([\d-]+)/);
            if (vqdMatch) {
                const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(searchQ)}&o=json&vqd=${vqdMatch[1]}&s=${offset}&f=,,,`;
                const res2 = await fetch(url, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
                });
                if (res2.ok) {
                    const json = await res2.json();
                    if (json.results && json.results.length > 0) {
                        photos = json.results
                            .map((r: any) => ({ image_url: r.image, title: r.title || cleanName }))
                            .filter((r: any) => isSafeFoodUrl(r.image_url));
                    }
                }
            }
        } catch (err) {
            console.warn("DuckDuckGo image search failed:", err);
        }

        if (photos.length === 0) {
            try {
                const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQ)}&adlt=strict&first=${offset}`;
                const resB = await fetch(bingUrl, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
                });
                if (resB.ok) {
                    const html = await resB.text();
                    const matches = html.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/g) || [];
                    const parsed = matches.map((m, idx) => {
                        const match = m.match(/&quot;murl&quot;:&quot;(https?:\/\/[^&]+)&quot;/);
                        const imgUrl = match ? decodeURIComponent(match[1]) : "";
                        return (imgUrl && isSafeFoodUrl(imgUrl)) ? {
                            image_url: imgUrl,
                            title: `${cleanName} Option ${idx + 1}`
                        } : null;
                    }).filter(Boolean);
                    if (parsed.length > 0) {
                        photos = parsed;
                    }
                }
            } catch (err) {
                console.warn("Bing image search failed:", err);
            }
        }

        if (photos.length === 0) {
            try {
                const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQ)}&safe=active&tbm=isch`;
                const resG = await fetch(googleUrl, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36" }
                });
                if (resG.ok) {
                    const html = await resG.text();
                    const matches = html.match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/g) || [];
                    const uniqueUrls = Array.from(new Set(matches.map(m => m.replace(/"/g, ''))))
                        .filter(url => !url.includes('google') && !url.includes('gstatic') && !url.includes('doubleclick') && !url.includes('analytics'))
                        .filter(isSafeFoodUrl);
                    
                    if (uniqueUrls.length > 0) {
                        photos = uniqueUrls.map((url, idx) => ({
                            image_url: url,
                            title: `${cleanName} Option ${idx + 1}`
                        }));
                    }
                }
            } catch (err) {
                console.warn("Google desktop image search failed:", err);
            }
        }

        return res.json({ success: true, data: photos });
    } catch (error: any) {
        console.error("Deep Image Proxy Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});
function normalizeVariants(menu: any[]) {
    const variantSuffixes = ['small', 'medium', 'large', 's', 'm', 'l', 'half', 'full', 'quarter', 'regular', 'jumbo', '250g', '500g', '1kg'];
    const finalMenu: any[] = [];
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
            const exactMatch = (item.name || "").trim().match(exactRegex);
            
            if (exactMatch && fallbackBaseName) {
                baseName = fallbackBaseName;
                variantName = exactMatch[1].trim();
                isVariant = true;
                break;
            }
            
            // Check for suffix with separator (e.g. "Pizza - Small" or "Pizza Small")
            const regex = new RegExp(`[\\s\\-_\\(]+(${suffix})(?:\\s*\\))?\\s*$`, 'i');
            const match = (item.name || "").match(regex);
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
    const resolvedMenu: any[] = [];
    
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
            
            let baseItemToMutate: any = null;
            if (matchingBaseEntries.length > 0) {
                // Merge into the first matching base item
                baseItemToMutate = matchingBaseEntries[0].item;
                matchingBaseEntries[0].type = 'merged'; 
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

// --- Merchant Onboarding & Menu Management API ---

app.post('/api/merchant/onboard', async (req, res) => {
    try {
        const { email, phone, password, restaurantName, menu: rawMenu, address, timings, contactPhone } = req.body;
        
        if (!email || !password || !restaurantName || !rawMenu || !Array.isArray(rawMenu)) {
            return res.status(400).json({ success: false, error: "Malformed payload. Required: email, password, restaurantName, menu[]" });
        }

        const menu = normalizeVariants(rawMenu);
        console.log(`[Merchant Onboard] Normalized menu length: ${menu.length}. Raw length: ${rawMenu.length}`);
        
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhone = phone ? phone.trim().toLowerCase() : undefined;

        // Safeguard 3: Prevent Duplicate Deploy
        const existingUser = await prisma.user.findFirst({ 
            where: { 
                OR: [
                    { email: normalizedEmail },
                    ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])
                ]
            } 
        });
        if (existingUser) {
            return res.status(409).json({ success: false, error: "Merchant with this email or phone already exists." });
        }

        const clerkId = require('crypto').randomUUID(); // Simulated Clerk ID
        
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Safeguard 2: Atomic Transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: normalizedEmail,
                    phone: normalizedPhone,
                    password: hashedPassword,
                    name: restaurantName,
                    clerkId,
                    role: "SELLER",
                    isVerified: true
                }
            });

            await tx.businessProfile.create({
                data: {
                    userId: clerkId,
                    businessName: restaurantName,
                    businessEmail: normalizedEmail
                }
            });

            // Safeguard 4: Category Uniqueness
            const categoryMap = new Map();
            for (const item of menu) {
                if (!item.category) continue;
                const catName = item.category.trim();
                const catKey = catName.toLowerCase();
                
                if (!categoryMap.has(catKey)) {
                    const newCat = await tx.category.create({
                        data: {
                            name: catName,
                            clerkId
                        }
                    });
                    categoryMap.set(catKey, newCat.id);
                }
            }

            const itemsToCreate = menu.map((item: any) => {
                const catKey = (item.category || "Uncategorized").trim().toLowerCase();
                const catId = categoryMap.get(catKey) || null;
                
                // Safeguard 5: Image Metadata mapping from img_status / assigned_image
                const imageUrl = (item.imageUrl && typeof item.imageUrl === 'string') ? item.imageUrl : (item.assigned_image && typeof item.assigned_image === 'string' ? item.assigned_image : null);

                let dbVariants = undefined;
                if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
                    dbVariants = [
                        {
                            id: require('crypto').randomUUID(),
                            groupName: "Variants",
                            type: "radio",
                            required: true,
                            options: item.variants.map((v: any) => {
                                const p = parseFloat(v.price || v.p);
                                return {
                                    id: require('crypto').randomUUID(),
                                    name: v.name || v.n || "Option",
                                    price: isNaN(p) ? null : p
                                };
                            })
                        }
                    ];
                }

                let basePrice: number | null = parseFloat(item.price);
                if (isNaN(basePrice)) {
                    if (dbVariants && dbVariants[0].options.length > 0 && dbVariants[0].options[0].price !== null) {
                        basePrice = dbVariants[0].options[0].price;
                    } else {
                        basePrice = null;
                    }
                }

                return {
                    name: item.name,
                    price: basePrice,
                    description: item.description || null,
                    categoryId: catId,
                    userId: user.id,
                    clerkId,
                    image: imageUrl,
                    imageUrl: imageUrl,
                    isActive: true,
                    variants: dbVariants
                };
            });

            if (itemsToCreate.length > 0) {
                await tx.item.createMany({ data: itemsToCreate });
            }

            return { user, itemsCount: itemsToCreate.length };
        });

        return res.status(201).json({ success: true, message: "Merchant onboarded successfully", data: result });
    } catch (error: any) {
        console.error("Merchant onboarding error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/menu/by-email', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') return res.status(400).json({ error: "Email query param required" });
        
        // Safeguard 6: Email normalize
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        const items = await prisma.item.findMany({
            where: { clerkId: user.clerkId! },
            include: { category: true }
        });
        const profile = await prisma.businessProfile.findFirst({
            where: { userId: user.clerkId! }
        });

        // Ensure default zones are present
        const defaultZones = ["MAIN KITCHEN", "BAR", "GRILL", "BAKERY", "COUNTER"];
        const userZones = profile?.zones && profile.zones.length > 0 ? profile.zones : defaultZones;

        res.json({ user, items, profile, zones: userZones });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/profile/zones
app.get('/api/profile/zones', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') return res.status(400).json({ error: "Email query param required" });
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        const profile = await prisma.businessProfile.findFirst({ where: { userId: user.clerkId! } });
        const defaultZones = ["MAIN KITCHEN", "BAR", "GRILL", "BAKERY", "COUNTER"];
        const userZones = profile?.zones && profile.zones.length > 0 ? profile.zones : defaultZones;
        res.json({ success: true, zones: userZones });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/profile/zones
app.post('/api/profile/zones', async (req, res) => {
    try {
        const { email, zoneName } = req.body;
        if (!email || !zoneName) return res.status(400).json({ error: "Email and zoneName required" });

        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        const profile = await prisma.businessProfile.findFirst({ where: { userId: user.clerkId! } });
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const newZone = zoneName.trim().toUpperCase();
        const currentZones = profile.zones || ["MAIN KITCHEN", "BAR", "GRILL", "BAKERY", "COUNTER"];
        
        if (!currentZones.includes(newZone)) {
            const updatedProfile = await prisma.businessProfile.update({
                where: { id: profile.id },
                data: { zones: [...currentZones, newZone] }
            });
            return res.json({ success: true, zones: updatedProfile.zones });
        }
        res.json({ success: true, zones: currentZones });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/items/bulk-update
app.put('/api/items/bulk-update', async (req, res) => {
    try {
        const { email, ids, zones } = req.body;
        if (!email || !ids || !Array.isArray(ids)) return res.status(400).json({ error: "Email and array of ids required" });

        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        const updateData: any = {};
        if (zones && Array.isArray(zones)) {
            updateData.zones = zones.map(z => String(z).toUpperCase());
        }

        const result = await prisma.item.updateMany({
            where: {
                id: { in: ids },
                clerkId: user.clerkId!
            },
            data: updateData
        });

        res.json({ success: true, updatedCount: result.count });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add Item
app.post('/api/menu/item', async (req, res) => {
    try {
        const { email, name, price, description, category, zones } = req.body;
        if (!email || !name || price === undefined) return res.status(400).json({ error: "Missing required fields" });
        
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        // Resolve or create category
        let catId = null;
        if (category) {
            const catName = category.trim();
            const existingCat = await prisma.category.findFirst({
                where: { clerkId: user.clerkId!, name: { equals: catName, mode: 'insensitive' } }
            });
            
            if (existingCat) {
                catId = existingCat.id;
            } else {
                const newCat = await prisma.category.create({
                    data: { name: catName, clerkId: user.clerkId! }
                });
                catId = newCat.id;
            }
        }

        const item = await prisma.item.create({
            data: {
                name,
                price: parseFloat(price) || 0,
                description: description || null,
                categoryId: catId,
                userId: user.id,
                clerkId: user.clerkId!,
                zones: Array.isArray(zones) ? zones.map(z => String(z).toUpperCase()) : [],
                isActive: true
            },
            include: { category: true }
        });

        return res.status(201).json({ success: true, item });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});
app.put('/api/menu/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, ...updateData } = req.body;
        
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(403).json({ error: "Unauthorized" });

        // Safeguard 5: Ownership validation
        const item = await prisma.item.findFirst({ where: { id, clerkId: user.clerkId! } });
        if (!item) return res.status(404).json({ error: "Item not found or unauthorized" });

        if (updateData.zones && Array.isArray(updateData.zones)) {
            updateData.zones = updateData.zones.map((z: any) => String(z).toUpperCase());
        }

        const updated = await prisma.item.update({
            where: { id },
            data: updateData
        });
        return res.json({ success: true, item: updated });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/api/menu/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body; // sent in DELETE body
        
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(403).json({ error: "Unauthorized" });

        // Safeguard 5: Ownership validation
        const item = await prisma.item.findFirst({ where: { id, clerkId: user.clerkId! } });
        if (!item) return res.status(404).json({ error: "Item not found or unauthorized" });

        await prisma.item.delete({ where: { id } });
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// --- ADVANCED BROWSE PRODUCTS ROUTES --- //

// 1. Merchant Email Search (Autocomplete)
app.get('/api/merchants/search', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        if (query.length < 2) return res.json({ users: [] });

        const users = await prisma.user.findMany({
            where: { email: { contains: query, mode: 'insensitive' } },
            select: { email: true, clerkId: true },
            take: 10
        });

        // Get business profile names for these users
        const clerkIds = users.map(u => u.clerkId).filter(Boolean) as string[];
        const profiles = await prisma.businessProfile.findMany({
            where: { userId: { in: clerkIds } },
            select: { userId: true, businessName: true }
        });

        const profileMap = new Map(profiles.map(p => [p.userId, p.businessName]));

        const results = users.map(u => ({
            email: u.email,
            restaurantName: profileMap.get(u.clerkId!) || 'Unknown Merchant'
        }));

        return res.json({ users: results });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 2. AI Bulk Upload directly to a merchant's catalog (with Zone)
app.post('/api/menu/bulk-upload', async (req, res) => {
    try {
        const { email, items, zone } = req.body;
        if (!email || !Array.isArray(items)) return res.status(400).json({ error: "Missing email or items array" });

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        const clerkId = user.clerkId!;
        const userId = user.id;

        // Fetch existing categories to avoid duplicates
        const existingCats = await prisma.category.findMany({ where: { clerkId } });
        const catMap = new Map<string, string>(existingCats.map(c => [c.name.toLowerCase(), c.id]));

        let addedCount = 0;

        for (const item of items) {
            const rawCatName = item.category || 'Uncategorized';
            const catNameLower = rawCatName.trim().toLowerCase();

            let catId = catMap.get(catNameLower);
            if (!catId) {
                const newCat = await prisma.category.create({
                    data: { name: rawCatName.trim(), clerkId }
                });
                catId = newCat.id;
                catMap.set(catNameLower, catId);
            }

            const itemZones = zone ? [zone.toUpperCase()] : [];

            await prisma.item.create({
                data: {
                    name: item.name || 'Unknown Item',
                    description: item.description || null,
                    price: parseFloat(item.price) || 0,
                    imageUrl: item.imageUrl || null,
                    clerkId,
                    userId,
                    categoryId: catId,
                    zones: itemZones,
                    isActive: true
                }
            });
            addedCount++;
        }

        return res.json({ success: true, addedCount });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. Clear All Images
app.delete('/api/menu/items/clear-images', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        await prisma.item.updateMany({
            where: { clerkId: user.clerkId! },
            data: { imageUrl: null }
        });

        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 4. Clear Entire Menu / Zone
app.delete('/api/menu/items/clear-all', async (req, res) => {
    try {
        const { email, zone } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        if (zone && zone !== 'All') {
            const upperZone = zone.toUpperCase();
            await prisma.item.deleteMany({
                where: { clerkId: user.clerkId!, zones: { has: upperZone } }
            });
        } else {
            // Delete all items and categories
            await prisma.item.deleteMany({ where: { clerkId: user.clerkId! } });
            await prisma.category.deleteMany({ where: { clerkId: user.clerkId! } });
        }

        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// 5. Clear All Bills
app.delete('/api/merchant/bills/clear', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) return res.status(404).json({ error: "Merchant not found" });

        await prisma.billManager.deleteMany({
            where: { clerkUserId: user.clerkId! }
        });

        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// --- CATEGORY MANAGEMENT ROUTES --- //
app.put('/api/menu/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email, name } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user) return res.status(403).json({ error: "Unauthorized" });

        const category = await prisma.category.findFirst({ where: { id, clerkId: user.clerkId! } });
        if (!category) return res.status(404).json({ error: "Category not found" });

        const updated = await prisma.category.update({
            where: { id },
            data: { name: name.trim() }
        });
        return res.json({ success: true, category: updated });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete('/api/menu/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user) return res.status(403).json({ error: "Unauthorized" });

        const category = await prisma.category.findFirst({ where: { id, clerkId: user.clerkId! } });
        if (!category) return res.status(404).json({ error: "Category not found" });

        // Delete all items in this category first
        await prisma.item.deleteMany({ where: { categoryId: id } });
        await prisma.category.delete({ where: { id } });

        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// --- FOODSNAP API PROXY --- //
app.get('/api/images/search', async (req, res) => {
    try {
        const query = req.query.q as string || '';
        const page = req.query.page as string || '1';
        const limit = req.query.limit as string || '20';
        
        const foodSnapUrl = `https://manager.foodsnap.in/api/image/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;
        
        // Fetch dynamically from FoodSnap
        const response = await fetch(foodSnapUrl, { timeout: 10000 } as any);
        if (!response.ok) throw new Error("FoodSnap API returned an error");
        
        const data = await response.json();
        return res.json(data);
    } catch (err: any) {
        console.error("FoodSnap API Error:", err);
        return res.status(500).json({ error: err.message, images: [] });
    }
});

// ==========================================
// SUPER ADMIN ACCESS CONTROL APIS
// ==========================================

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
                clerkId: true
            }
        });
        
        const mappedUsers = users.map(u => ({
            ...u,
            loginType: u.clerkId ? "CLERK" : "CUSTOM"
        }));
        
        res.json(mappedUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isDisabled: true,
                clerkId: true,
                phone: true,
                secondaryEmails: true,
                secondaryPhones: true,
                allowedPaths: true,
                createdAt: true
            }
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        
        res.json({
            ...user,
            loginType: user.clerkId ? "CLERK" : "CUSTOM"
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "Missing required fields" });

        const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existing) return res.status(400).json({ error: "Email already exists" });

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                role: role || "USER",
                isDisabled: false,
                isVerified: true
            }
        });

        res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/users', async (req, res) => {
    try {
        const { userId, name, password, secondaryEmails, secondaryPhones, allowedPaths, isDisabled, phone } = req.body;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (secondaryEmails !== undefined) updateData.secondaryEmails = secondaryEmails;
        if (secondaryPhones !== undefined) updateData.secondaryPhones = secondaryPhones;
        if (allowedPaths !== undefined) updateData.allowedPaths = allowedPaths;
        if (isDisabled !== undefined) updateData.isDisabled = isDisabled;
        if (phone !== undefined) updateData.phone = phone;

        if (password) {
            const bcrypt = require('bcryptjs');
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        res.json({ success: true, updated: { id: updated.id } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/users/role', async (req, res) => {
    try {
        const { targetUserId, role } = req.body;
        if (!targetUserId || !role) return res.status(400).json({ error: "Missing targetUserId or role" });

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { role }
        });

        res.json({ success: true, updated: { id: updated.id, role: updated.role } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admin/users/disable', async (req, res) => {
    try {
        const { targetUserId, disable } = req.body;
        if (!targetUserId || disable === undefined) return res.status(400).json({ error: "Missing targetUserId or disable status" });

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { isDisabled: disable }
        });

        res.json({ success: true, updated: { id: updated.id, isDisabled: updated.isDisabled } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/users', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "Missing userId" });

        await prisma.user.delete({ where: { id: String(userId) } });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export function startServer() {
  app.listen(port, () => {
    writeLog(`Lite API Server running on port ${port}`);
  });
}

