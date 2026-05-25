"""Weather API via Open-Meteo (free, no API key)."""

import httpx


async def get_weather(location: str) -> dict:
    """Geocode location and fetch current weather."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            geo = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": location, "count": 1},
            )
            geo.raise_for_status()
            geo_data = geo.json()

            if not geo_data.get("results"):
                return {
                    "location": location,
                    "temperature": 20,
                    "condition": "unknown",
                    "suggestion": "Layer up with a versatile jacket just in case!",
                }

            place = geo_data["results"][0]
            lat, lon = place["latitude"], place["longitude"]
            city = place.get("name", location)

            weather = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,weather_code,wind_speed_10m",
                },
            )
            weather.raise_for_status()
            current = weather.json().get("current", {})

            temp = current.get("temperature_2m", 20)
            code = current.get("weather_code", 0)
            condition = _weather_code_to_text(code)
            suggestion = _outfit_suggestion(temp, condition)

            return {
                "location": city,
                "temperature": temp,
                "condition": condition,
                "windSpeed": current.get("wind_speed_10m", 0),
                "suggestion": suggestion,
            }
        except Exception:
            return {
                "location": location,
                "temperature": 20,
                "condition": "unknown",
                "suggestion": "A light jacket is always a safe choice!",
            }


def _weather_code_to_text(code: int) -> str:
    mapping = {
        0: "clear",
        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",
        45: "foggy",
        48: "foggy",
        51: "drizzle",
        53: "drizzle",
        55: "drizzle",
        61: "rain",
        63: "rain",
        65: "heavy rain",
        71: "snow",
        73: "snow",
        75: "heavy snow",
        80: "rain showers",
        95: "thunderstorm",
    }
    return mapping.get(code, "variable")


def _outfit_suggestion(temp: float, condition: str) -> str:
    if temp < 5:
        return "Bundle up! Heavy jacket, layers, and warm accessories are essential."
    if temp < 15:
        return "Cool weather — a stylish jacket or coat will complete your look perfectly."
    if temp < 25:
        return "Perfect layering weather! A light jacket is optional but adds flair."
    if "rain" in condition or "drizzle" in condition:
        return "Rain expected — consider a water-resistant jacket and skip suede footwear."
    return "Warm and sunny — keep it light and breathable. Sunglasses and a cap recommended!"
