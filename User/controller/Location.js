import { toast } from "sonner";
const baseURL = import.meta.env.VITE_API_URL;

// Use Nominatim for free reverse geocoding (no API key needed)
async function getAddressFromCoords(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "YourAppName/1.0 (your.email@example.com)",
      },
    });
    const data = await res.json();
    return data.display_name || "Address not found";
  } catch {
    return "Error fetching address";
  }
}

export const login = async (formData, setIsLoading) => {
  setIsLoading(true);

  try {
    // Get user location first
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Get human-readable address
    const address = await getAddressFromCoords(lat, lon);
    console.log("User Address:", address);

    // Send login data along with address
    const payload = {
      ...formData,
      address,
    };

    const response = await fetch(`${baseURL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    toast.success(data.message || "Login successful!");

    if (response.ok) {
      location.href = "/";
    }
  } catch (error) {
    toast.error(error.message || "Login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};
