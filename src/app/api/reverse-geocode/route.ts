import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
  }

  try {
    // 1. Try OpenStreetMap Nominatim reverse geocoder
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "PinkFarmECommerce/1.0 (wecare@pinkfarm.in)",
          "Accept-Language": "en",
        },
      }
    );

    if (nominatimRes.ok) {
      const data = await nominatimRes.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.street || addr.residential || "";
        const houseNumber = addr.house_number || addr.building || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.subdivision || addr.quarter || "";
        const city = addr.city || addr.town || addr.village || addr.state_district || addr.county || "";
        const state = addr.state || "";
        let pinCode = addr.postcode || "";

        // Standardize Indian 6-digit PIN code if formatted with space
        if (pinCode) {
          pinCode = pinCode.replace(/\s+/g, "").slice(0, 6);
        }

        const addressLine1 = [houseNumber, road].filter(Boolean).join(", ") || suburb || "";
        const addressLine2 = suburb && addressLine1 !== suburb ? suburb : (addr.amenity || addr.shop || "");

        return NextResponse.json({
          success: true,
          pinCode,
          city,
          state,
          addressLine1,
          addressLine2,
          displayName: data.display_name,
        });
      }
    }

    // 2. Fallback to BigDataCloud client geocoder
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      return NextResponse.json({
        success: true,
        pinCode: bdcData.postcode ? bdcData.postcode.replace(/\s+/g, "").slice(0, 6) : "",
        city: bdcData.city || bdcData.locality || "",
        state: bdcData.principalSubdivision || "",
        addressLine1: bdcData.locality || "",
        addressLine2: "",
        displayName: `${bdcData.locality || ""}, ${bdcData.city || ""}, ${bdcData.principalSubdivision || ""}`,
      });
    }

    return NextResponse.json({ error: "Could not resolve address" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Geocoding failed" }, { status: 500 });
  }
}
