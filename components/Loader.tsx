
import React, { useState, useEffect } from 'react';

const messages = [
    "Analyzing your video's first frame...",
    "Mapping your command to dynamic effects...",
    "Applying creative style and mood...",
    "Setting the pace and intensity...",
    "Rendering final video frames...",
    "This can take a few minutes, good things come to those who wait!",
    "Almost there, preparing your download...",
];

interface LoaderProps {
    message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
    const [currentMessage, setCurrentMessage] = useState(messages[0]);

    useEffect(() => {
        if(message) {
            setCurrentMessage(message);
        } else {
             const interval = setInterval(() => {
                setCurrentMessage(prev => {
                    const currentIndex = messages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % messages.length;
                    return messages[nextIndex];
                });
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [message]);

    return (
        <div className="mt-8 flex flex-col items-center justify-center p-6 bg-gray-800 rounded-2xl shadow-lg">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-lg font-semibold text-gray-300">Generating Your Video...</p>
            <p className="mt-2 text-sm text-gray-400 text-center">{currentMessage}</p>
        </div>
    );
};
