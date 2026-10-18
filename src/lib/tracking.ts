/**
 * Utility to resolve live tracking URLs for couriers.
 * If a custom URL is provided, it is prioritized.
 * Otherwise, popular Indian couriers are matched automatically by name.
 * If courier is unknown, a targeted search/universal tracking URL is produced.
 */
export function resolveTrackingUrl(
  carrierName?: string | null,
  trackingNumber?: string | null,
  customTrackingUrl?: string | null
): string | null {
  if (customTrackingUrl && customTrackingUrl.trim()) {
    const trimmed = customTrackingUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  if (!trackingNumber || !trackingNumber.trim()) {
    return null;
  }

  const awb = trackingNumber.trim();
  const encodedAwb = encodeURIComponent(awb);
  const carrier = (carrierName || "").toLowerCase().trim();

  // Delhivery
  if (carrier.includes("delhivery")) {
    return `https://www.delhivery.com/track/package/${encodedAwb}`;
  }

  // Blue Dart
  if (carrier.includes("blue dart") || carrier.includes("bluedart")) {
    return `https://www.bluedart.com/tracking?handler=traking&action=custTrack&numbers=${encodedAwb}`;
  }

  // Shiprocket
  if (carrier.includes("shiprocket")) {
    return `https://shiprocket.co/tracking/${encodedAwb}`;
  }

  // DTDC
  if (carrier.includes("dtdc")) {
    return `https://www.dtdc.in/tracking.asp?trkid=${encodedAwb}`;
  }

  // India Post / Speed Post
  if (
    carrier.includes("india post") ||
    carrier.includes("indiapost") ||
    carrier.includes("speed post") ||
    carrier.includes("post office")
  ) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.ui/trackconsignment.aspx`;
  }

  // Xpressbees
  if (carrier.includes("xpressbees") || carrier.includes("xpress bees") || carrier.includes("xpress")) {
    return `https://www.xpressbees.com/track?isawb=Yes&trackid=${encodedAwb}`;
  }

  // Shadowfax
  if (carrier.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track?awb=${encodedAwb}`;
  }

  // Ecom Express
  if (carrier.includes("ecom express") || carrier.includes("ecomexpress") || carrier.includes("ecom")) {
    return `https://ecomexpress.in/tracking/?awb_field=${encodedAwb}`;
  }

  // Amazon Shipping
  if (carrier.includes("amazon") || carrier.includes("ats")) {
    return `https://track.amazon.in/tracking/${encodedAwb}`;
  }

  // FedEx
  if (carrier.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodedAwb}`;
  }

  // DHL
  if (carrier.includes("dhl")) {
    return `https://www.dhl.com/in-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodedAwb}`;
  }

  // Professional Couriers
  if (carrier.includes("professional")) {
    return `https://www.tpcindia.com/`;
  }

  // If carrier name was provided, search Google with carrier + AWB for instant direct tracking
  if (carrier) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${carrierName} tracking ${awb}`)}`;
  }

  // Fallback to universal tracking
  return `https://t.17track.net/en#nums=${encodedAwb}`;
}
