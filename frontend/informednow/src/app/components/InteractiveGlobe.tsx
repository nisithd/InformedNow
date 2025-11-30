import React, {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';

interface Location {
    lat: number;
    lng: number;
    name: string;
}

interface OSMResponse {
    lat: string;
    lon: string;

    [key: string]: any;
}

// Gen random data
const N = 300;
const gData = [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
    color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
}));
//prevents server side rendering for the globe
const Globe = dynamic(() => import('react-globe.gl'), {ssr: false});

const GlobeComponent: React.FC = () => {
    const [location, setLocation] = useState<Location | null>(null);
    const [points, setPoints] = useState<{ lat: number; lng: number; size: number; color: string }[]>([]);
    const [locationName, setLocationName] = useState<string>('');

    const getCoordinates = async (locationName: string) => {
        try {

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&addressdetails=1&limit=1`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch location data');
            }

            const data: OSMResponse[] = await response.json();

            if (data && data.length > 0) {
                const {lat, lon} = data[0];
                setLocation({
                    lat: parseFloat(lat),
                    lng: parseFloat(lon),
                    name: locationName,
                });

                setPoints([
                    {lat: parseFloat(lat), lng: parseFloat(lon), size: 10, color: 'blue'},
                ]);
            } else {
                console.error('Location not found');
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocationName(event.target.value);
    };

    // Handle form submission (fetch coordinates)
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (locationName.trim()) {
            getCoordinates(locationName);
        }
    };

    return (
        <>
            <div>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={locationName}
                        onChange={handleInputChange}
                        placeholder="Enter a location"
                        style={{padding: '10px', fontSize: '16px', width: '300px'}}
                    />
                    <button type="submit" style={{padding: '10px', fontSize: '16px'}}>
                        Search
                    </button>
                </form>
            </div>

            <div style={{height: '100vh'}}>
                {location && (
                    <div>
                        <h2>Location: {location.name}</h2>
                        <h3>Coordinates: {location.lat}, {location.lng}</h3>
                    </div>
                )}
                <Globe
                    globeTileEngineUrl={(x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`}
                    pointsData={points}
                    pointAltitude="size"
                    pointColor="color"
                />
            </div>
        </>

    );
}
export default GlobeComponent;