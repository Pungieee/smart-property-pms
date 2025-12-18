# Smart Property PMS

**Smart Property PMS** is a simple, centralized portal to manage real‑estate units, sales contracts, and maintenance tasks.  
Built as a project to practice **role-based access control (RBAC)**, clean API design, and a scalable app structure.  

> Data for this project comes from [New York Housing Market Dataset on Kaggle](https://www.kaggle.com/datasets/nelgiriyewithana/new-york-housing-market)

---

## Why I Built This

I wanted to go beyond tutorials and build something real:

- Learn **RBAC** end-to-end (Admin, Sales, Technician)  
- Model **real estate workflows**: Units → Contracts → Installments, Units → Maintenance Tasks  
- Practice **frontend + backend** with React, Vite, Tailwind, Node.js, Express  
- Think about **scalability & architecture**: API structure, caching, and database integration

---

## Features

- **Centralized Portal**: Inventory, contracts, maintenance in one dashboard  
- **Role-Based Access**:
  - Admin: full access  
  - Sales: inventory & contracts  
  - Technician: maintenance tasks only  
- **Dashboard & Insights**:
  - Portfolio KPIs  
  - Area-based average price charts  
  - Inventory snapshot  
  - Maintenance queue  
- **RBAC Enforcement**: At API layer via `x-role` header, reflected in frontend  

---

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS, `recharts`, `lucide-react`  
- **Backend**: Node.js + Express, simple in-memory dataset (`data.json`)  
- **DevOps-ready**: CORS enabled, health endpoint for monitoring  

---

## Project Structure

```text
smart-property-dashboard/
  client/   # React frontend
  server/   # Node/Express backend
