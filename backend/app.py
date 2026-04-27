import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv

# Initialize environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase Client Init
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


@app.route('/api/locations', methods=['GET'])
def get_locations():
    """Fetch all saved locations ordered by newest first."""
    try:
        response = supabase.table('locations').select('*').order('created_at', desc=True).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch locations", "details": str(e)}), 500


@app.route('/api/locations', methods=['POST'])
def save_location():
    """Insert a new location record into the database."""
    try:
        data = request.json
        payload = {
            "name": data.get("name"),
            "lat": data.get("lat"),
            "lng": data.get("lng"),
            "temperature": data.get("temperature"),
            "condition": data.get("condition")
        }
        
        response = supabase.table('locations').insert(payload).execute()
        return jsonify(response.data), 201
    except Exception as e:
        return jsonify({"error": "Failed to save location", "details": str(e)}), 500


@app.route('/api/locations/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    """Update the custom name of an existing location record."""
    try:
        data = request.json
        response = supabase.table('locations').update({"name": data.get("name")}).eq("id", location_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({"error": "Failed to update location", "details": str(e)}), 500


@app.route('/api/locations/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    """Delete a location record by its ID."""
    try:
        supabase.table('locations').delete().eq("id", location_id).execute()
        return jsonify({"message": "Location deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete location", "details": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)