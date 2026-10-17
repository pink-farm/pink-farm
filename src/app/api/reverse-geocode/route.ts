import { NextResponse } from "next/server";
import { parseGeocodeCoordinates } from "@/lib/request-security.mjs";
import { logServerError } from "@/lib/server-log.mjs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latInput = searchParams.get("lat");
  const lonInput = searchParams.get("lon");

  const coordinates = parseGeocodeCoordinates(latInput, lonInput);
  if (!coordinates) {
    return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
  }
  const { latitude, longitude } = coordinates;

  try {
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    nominatimUrl.search = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
      addressdetails: "1",
    }).toString();

    // 1. Try OpenStreetMap Nominatim reverse geocoder
    const nominatimRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "PinkFarmECommerce/1.0 (wecare@pinkfarm.in)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(5000),
    });

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
    const bdcUrl = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    bdcUrl.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), localityLanguage: "en" }).toString();
    const bdcRes = await fetch(bdcUrl, { signal: AbortSignal.timeout(5000) });
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
  } catch (error) {
    logServerError("security.geocode.provider_failed", error);
    return NextResponse.json({ error: "Address lookup is temporarily unavailable." }, { status: 502 });
  }
}
