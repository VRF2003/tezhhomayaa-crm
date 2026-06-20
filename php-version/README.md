# Tezhhomayaa Buyer App - PHP/MySQL Migration

This folder contains the complete backend solution required to migrate your application away from your browser's local IndexedDB, and onto a permanent **PHP/MySQL** server architecture.

## Why this approach?
The CRM is built as a highly interactive "Single Page Application" (SPA). Because things like the Order Builder, Live Costing, and the MOQ Conversion Engine require instant calculations as the user types, replacing the entire front-end with PHP page reloads would ruin the user experience.

Instead, this solution uses a **Headless API approach**. You keep your existing beautiful Vanilla JS front-end (which you can host anywhere, like Vercel or cPanel), and you simply "point" it to communicate with the PHP files included in this folder.

---

## 1. Deploying the Backend (MySQL & PHP)

1. **Create the Database:**
   - Log into your web host (e.g. cPanel).
   - Go to phpMyAdmin or MySQL Databases and create a new database (e.g., `tezhhomayaa_crm`).
   - Import the `schema.sql` file provided in this folder into that new database.

2. **Configure Database Credentials:**
   - Open `backend/config.php` in a text editor.
   - Update the `$db_host`, `$db_name`, `$db_user`, and `$db_pass` variables with your live database credentials.

3. **Upload the PHP Files:**
   - Upload the entire `backend/` folder to your web host using FTP or File Manager.
   - Note the exact URL where the `api.php` file is accessible (e.g., `https://your-domain.com/backend/api.php`).

---

## 2. Connecting the Frontend

Once your backend is live, you need to tell your existing frontend application to stop using the browser's IndexedDB and start talking to your new PHP API.

1. **Copy `db-api.js`:**
   - Take the `db-api.js` file from this folder and copy it into your main frontend project's `src/` folder.

2. **Update the API URL:**
   - Open `src/db-api.js` and change `const API_BASE = 'https://your-domain.com/backend/api.php';` to point to the actual URL where you uploaded the PHP file.

3. **Wire it into the App:**
   - In your frontend project, open `src/main.js` and `src/data.js`.
   - Look for the import statements at the top of those files:
     ```javascript
     import { db_products, db_settings } from './db.js';
     import { db_quotes, deleteQuote, updateQuoteStatus } from './crm.js';
     ```
   - **Change them** to point to your new API file instead:
     ```javascript
     import { db_products, db_settings, db_quotes, deleteQuote, updateQuoteStatus } from './db-api.js';
     ```

4. **Build and Deploy:**
   - Run `npm run build` in your frontend project.
   - The compiled frontend will now permanently read/write all products, quotes, and settings directly to your MySQL database via the PHP API!
