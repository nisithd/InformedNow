export function getUserLocation(success, fail) {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log("User location:", lat, lon);
        success({ lat, lon });
      },
      (err) => {
        console.error("Failed to get location:", err);
        fail(err);
      }
    );
  } else {
    const error = new Error("Geolocation not supported");
    console.error(error);
    fail(error);
  }
}