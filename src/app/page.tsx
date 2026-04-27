"use client";

import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, Snowflake, Trash2, Edit2, Save, MapPin, Download } from "lucide-react";

// --- TYPESCRIPT INTERFACES ---

interface WeatherData {
  name: string;
  lat: number;
  lon: number;
  current: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

// Updated schema to match the Python API payload
interface SavedLocation {
  id: number;
  name: string;
  lat?: number;
  lng?: number;
  temperature: number;
  condition?: string;
  created_at?: string; 
}

const getWeatherIcon = (code: number) => {
  if (code <= 3) return <Sun className="w-10 h-10 text-yellow-500 mx-auto" />;
  if (code <= 48) return <Cloud className="w-10 h-10 text-slate-400 mx-auto" />;
  if (code <= 67) return <CloudRain className="w-10 h-10 text-blue-500 mx-auto" />;
  return <Snowflake className="w-10 h-10 text-blue-300 mx-auto" />;
};

// Python Backend URL
const API_URL = "http://127.0.0.1:5000/api/locations";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [locationInput, setLocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<SavedLocation[]>([]);

  // --- PYTHON API CRUD OPERATIONS ---
  
  // READ: Fetch all saved locations from the Python backend
  const fetchHistory = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setHistory(data as SavedLocation[]);
      }
    } catch (error) {
      console.error("Failed to fetch history from Python server:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // CREATE: Send the current weather to the Python backend to be saved
  const saveToDatabase = async () => {
    if (!weatherData) return;
    
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: weatherData.name,
          lat: weatherData.lat,
          lng: weatherData.lon,
          temperature: weatherData.current.temperature,
          condition: weatherData.current.weathercode.toString()
        }),
      });

      if (res.ok) {
        fetchHistory();
      } else {
        alert("Error saving to database.");
      }
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  // DELETE: Tell the Python backend to remove a specific record
  const deleteRecord = async (id: number) => {
    if (confirm("Delete this saved location?")) {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: "DELETE",
        });
        if (res.ok) fetchHistory();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  // UPDATE: Tell the Python backend to rename a specific record
  const updateRecord = async (id: number, currentName: string) => {
    const newName = prompt("Rename this location:", currentName);
    if (newName && newName.trim() !== "") {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (res.ok) fetchHistory();
      } catch (error) {
        console.error("Error updating:", error);
      }
    }
  };

  // --- OPEN METEO API OPERATIONS ---

  const getWeatherData = async (lat: number, lon: number, displayName: string) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`
      );
      
      if (!res.ok) throw new Error("Failed to fetch weather data.");
      
      const data = await res.json();

      setWeatherData({
        name: displayName,
        lat: lat,
        lon: lon,
        current: data.current_weather,
        daily: data.daily,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get weather data.";
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setWeatherData(null);

    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${locationInput}&count=1`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try again.");
      }

      const { latitude, longitude, name, admin1, country } = geoData.results[0];
      const fullName = `${name}, ${admin1 || country}`;
      
      await getWeatherData(latitude, longitude, fullName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during search.";
      setErrorMsg(errorMessage);
      setLoading(false);
    }
  };

  const handleGPSSearch = () => {
    setLoading(true);
    setErrorMsg("");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            const reverseGeo = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const reverseData = await reverseGeo.json();
            await getWeatherData(lat, lon, `${reverseData.city}, ${reverseData.principalSubdivision}`);
          } catch {
            await getWeatherData(lat, lon, "Your Location");
          }
        },
        () => {
          setErrorMsg("Location access denied.");
          setLoading(false);
        }
      );
    } else {
      setErrorMsg("GPS not supported by your browser.");
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "weather_history_export.json";
    link.click();
  };

  // --- UI RENDERING ---
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start flex-1">
        
        {/* Left Side: Search & Weather */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">Full-Stack Weather Explorer</h1>
          
          <form onSubmit={handleManualSearch} className="flex gap-2 mb-4">
            <button 
              type="button" 
              onClick={handleGPSSearch}
              className="p-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              title="Use GPS Location"
            >
              <MapPin className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter a city or zip..."
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? "..." : "Search"}
            </button>
          </form>

          {errorMsg && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {weatherData && (
            <div className="mt-6">
              <div className="text-center bg-slate-50 p-6 rounded-lg border border-slate-100 relative">
                <button 
                  onClick={saveToDatabase}
                  className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-white border border-slate-300 px-2 py-1 rounded hover:bg-slate-100 transition-colors text-black"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
                <h2 className="text-xl font-bold text-slate-700">{weatherData.name}</h2>
                <div className="flex justify-center items-center gap-4 my-4">
                  {getWeatherIcon(weatherData.current.weathercode)}
                  <span className="text-6xl font-bold text-blue-600">{Math.round(weatherData.current.temperature)}°</span>
                </div>
                <p className="text-slate-500">Wind: {weatherData.current.windspeed} mph</p>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">5-Day Forecast</h3>
                <div className="grid grid-cols-5 gap-2">
                  {weatherData.daily.time.slice(1, 6).map((dateStr: string, i: number) => {
                    const dayIndex = i + 1; 
                    const dayName = new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
                    return (
                      <div key={dateStr} className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                        <span className="text-xs font-bold text-slate-600 block mb-1">{dayName}</span>
                        {getWeatherIcon(weatherData.daily.weathercode[dayIndex])}
                        <div className="text-sm font-bold text-slate-800 mt-2">{Math.round(weatherData.daily.temperature_2m_max[dayIndex])}°</div>
                        <div className="text-xs text-slate-400">{Math.round(weatherData.daily.temperature_2m_min[dayIndex])}°</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 h-48 rounded-lg overflow-hidden border border-slate-200">
                <iframe
                  title="Google Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${weatherData.lat},${weatherData.lon}&z=11&output=embed`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Database CRUD */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 flex flex-col h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Saved Locations</h2>
          
          <div className="flex-1">
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-10">No locations saved yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((item) => (
                  <li key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.temperature}°F</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateRecord(item.id, item.name)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRecord(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            onClick={handleExport}
            disabled={history.length === 0}
            className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
          >
            <Download className="w-5 h-5" /> Download JSON
          </button>
        </div>
      </div>

      {/* Mandatory Information Footer */}
      <footer className="w-full max-w-5xl mt-8 bg-white rounded-xl shadow-sm p-6 border border-slate-200 text-center text-slate-600">
        <p className="font-semibold text-slate-800 mb-2">Developed by Antriksh Gupta</p>
        <p className="text-sm leading-relaxed max-w-3xl mx-auto">
          This application was built as a technical assessment for the <strong>Product Manager Accelerator</strong>. 
          The PM Accelerator is a premier career incubator that helps international professionals transition into Product Management, 
          offering structured job search frameworks, elite networking, and 1-on-1 coaching to build global product leaders.
        </p>
      </footer>
    </main>
  );
}