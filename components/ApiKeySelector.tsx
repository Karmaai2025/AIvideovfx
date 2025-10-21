
import React from 'react';

interface ApiKeySelectorProps {
    onSelectKey: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onSelectKey }) => {
    return (
        <div className="mt-8 bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-center">
            <h3 className="font-bold">API Key Required</h3>
            <p className="text-sm my-2">
                This application uses the Veo video generation model, which requires you to select your own API key. 
                Please ensure your project is properly configured for billing.
                You can find more information about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-100">ai.google.dev/gemini-api/docs/billing</a>.
            </p>
            <button
                onClick={onSelectKey}
                className="mt-2 px-6 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors duration-300"
            >
                Select API Key
            </button>
        </div>
    );
};
