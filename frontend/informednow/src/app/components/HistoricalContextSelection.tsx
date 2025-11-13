'use client';
import React, {useState} from 'react';

interface HistoricalContextSelectionProps {
  desc: string;
}
export default function HistoricalContextSelection({desc}: HistoricalContextSelectionProps) {
    const [selectedText, setSelectedText] = useState<string>('');
    const [responseData, setResponseData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const getSelectedText = (): string => {
        const selection = window.getSelection();
        return selection && selection.toString() ? selection.toString() : '';
    };
    const handleMouseUp = () => {
        const text = getSelectedText();
        if (text) {
            setSelectedText(text);
        }
    };

    const handleButtonClick = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/addHistoricalContext/', {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({"data": selectedText}),
                });
                const data = await response.json();
                const llmResponse = data.candidates[0]?.content?.parts[0]?.text;
                setResponseData(llmResponse);
            } catch
                (err) {
                setError('Failed to fetch historical context');
            } finally {
                setLoading(false);
            }


        }
    ;

    return (
        <div>
            <div
                onMouseUp={handleMouseUp}
            >
                <p> {desc}</p>

            </div>
            <button onClick={handleButtonClick} disabled={loading}>
                Get Historical Context!
            </button>
            {responseData && (
                <div>
                    <h3>Context:</h3>
                    <p>{responseData}</p>
                </div>
            )}
        </div>


    );
};