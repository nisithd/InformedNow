import React, {useEffect, useState} from 'react';
import dynamic from 'next/dynamic';

interface OSMResponse {
    lat: string;
    lon: string;

    [key: string]: any;
}

interface Marker {
    lat: number;
    lng: number;
    title: string;
    color: string
}

interface Article {
    articleTitle: string;
    articleLocation: string[];
}

interface GlobeComponentProps {
    page: number;
}

const Globe = dynamic(() => import('react-globe.gl'), {ssr: false});

const GlobeComponent: React.FC<GlobeComponentProps>= ({page}) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isGlobeVisible, setIsGlobeVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const getLocationNames = async () => {
        try {
            const response = await fetch(
                `/api/article/locationNames`, {
                    method: "GET",
                    headers: {"Content-Type": "application/json"}
                }
            );
            if (!response.ok) {
                throw new Error('Failed to fetch location data');
            }
            const data = await response.json();
            if (data) {
                setArticles(data.locations);
            }

        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

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
                return [parseFloat(lon), parseFloat(lat)];
            } else {
                return null
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    const fetchMarkers = async () => {
        const fetchedMarkers: Marker[] = [];

        const isCloseToExistingMarker = (lat: number, lng: number) => {
            const threshold = 13;
            return fetchedMarkers.some(marker => {
                return (
                    Math.abs(marker.lat - lat) < threshold &&
                    Math.abs(marker.lng - lng) < threshold
                );
            });
        };
        const generateRandomOffset = () => {
            const offsetRange = 7;
            return {
                latOffset: (Math.random() * offsetRange * 2.6) - offsetRange,
                lngOffset: (Math.random() * offsetRange * 4.8) - offsetRange,
            };
        };

        for (const article of articles) {
            for (const location of article.articleLocation) {
                const coordinates = await getCoordinates(location);
                if (coordinates) {
                    let lat = coordinates[1];
                    let lng = coordinates[0];
                    if (isCloseToExistingMarker(lat, lng)) {
                        const {latOffset, lngOffset} = generateRandomOffset();
                        lat += latOffset;
                        lng += lngOffset;
                    }

                    fetchedMarkers.push({
                        lat: lat,
                        lng: lng,
                        title: article.articleTitle,
                        color: ['black'][Math.round(Math.random() * 3)]
                    });
                }
            }
        }

        setMarkers(fetchedMarkers);
        setIsLoaded(true);
        setIsLoading(false);
    };

    const handleLoadGlobe = async () => {
        setIsLoading(true);
        await getLocationNames();

        if (articles.length>0){
             fetchMarkers().then(() => {
                setIsGlobeVisible(true);
            }).catch((error) => {
                console.error('Error fetching markers names:', error);
            });
        }else{
            setIsLoading(false);
        }
    };
    const toggleGlobeVisibility = () => {
        setIsGlobeVisible((prevState) => !prevState);  // Toggle between true/false
    };

    return (
        <div className="p-6 ">
            <div className="flex gap-4 space-x-4 justify-center items-center">
                <button
                    onClick={handleLoadGlobe}
                    className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                    Load Globe
                </button>

                <button
                    onClick={toggleGlobeVisibility}
                    className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"

                >
                    Hide Globe
                </button>

            </div>

            {isLoading && (
                <div style={{textAlign: 'center', marginTop: '20px', color: "black"}}>
                    <p>Loading the globe...</p>
                    <div className="spinner" style={{marginTop: '20px'}}>
                        <div className="spinner-circle"></div>
                    </div>
                </div>
            )}

            {isLoaded && isGlobeVisible && !isLoading && (
                <div style={{height: '100vh'}}>
                    <Globe
                        globeTileEngineUrl={(x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`}
                        labelsData={markers}
                        labelText="title"
                        labelColor="color"
                        labelSize={0.4}
                        labelDotRadius={0.05}
                    />
                </div>
            )}
            <a href="https://www.openstreetmap.org/copyright">Map data from © OpenStreetMap</a>
        </div>
    );
}
export default GlobeComponent;