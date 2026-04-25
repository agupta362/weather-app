# AI Weather Explorer - PM Accelerator Assessment

This is a Full-Stack Weather Application built for the PM Accelerator AI Engineer Intern technical assessment. 

## 🚀 Features Implemented
* **Smart Search & GPS:** Look up weather by city/zip, or use browser Geolocation to get local weather.
* **5-Day Forecast:** Dynamic forecast grid using the Open-Meteo API.
* **Database CRUD:** Users can Save, Read, Update (Rename), and Delete locations using a PostgreSQL database (Supabase).
* **Map Integration:** Embedded Google Maps UI mapping directly to the searched coordinates.
* **Data Export:** Ability to download database history as a formatted JSON file.
* **Responsive Design:** Fully mobile-responsive UI built with Tailwind CSS.

## 🛠️ Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide-react icons.
* **Backend/Database:** Supabase (PostgreSQL).
* **APIs:** Open-Meteo (Weather & Geocoding), BigDataCloud (Reverse Geocoding).

## ⚙️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/pm-accelerator-weather-app.git](https://github.com/YOUR_USERNAME/pm-accelerator-weather-app.git)
   cd pm-accelerator-weather-app
Install dependencies:
(Note: The package.json file serves as the requirements file for this project).

Bash
npm install
Set up Environment Variables:
Create a .env.local file in the root directory and add your Supabase credentials:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
(Note: Row Level Security is disabled on the weather_searches table per assessment instructions).

Run the development server:

Bash
npm run dev
Open http://localhost:3000 with your browser to see the result.

*(Make sure to change `YOUR_USERNAME` in the clone link to your actual GitHub username).*

