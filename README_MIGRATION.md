# Architecture Migration Guide

## Current Architecture
The application currently uses **IndexedDB** for local browser storage. All data is managed locally and there is no cloud database.

## Future Architecture
We are transitioning to a true SaaS model using **PHP** as the REST API backend and **MySQL** as the relational database.

## Migration Order
1. **IndexedDB** (Current state)
2. **PHP API + MySQL** (Centralized relational database)
3. **Cloudinary** (Media asset offloading)
4. **Authentication** (Firebase Auth login layer)

The `src/services/` layer has been created to decouple the UI from IndexedDB. Once the PHP API is live, you only need to update the `src/services/` files to point to the new endpoints. No other UI components will need to change.
