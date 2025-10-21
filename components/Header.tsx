import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                AI Video FX Replicator
            </h1>
            <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
               Upload your image or video, provide a reference video for the animation style, and let AI replicate the effect for you.
            </p>
        </header>
    );
};
