export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}

export type GpsPoint = { lat: number; lng: number; accuracyM: number }

export function captureGps(): Promise<GpsPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('この端末は位置情報に対応していません'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
        })
      },
      (err) => reject(new Error(err.message || '位置情報を取得できませんでした')),
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
    )
  })
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`
}

export function formatGps(lat: number, lng: number): string {
  if (!lat && !lng) return '位置なし'
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}
