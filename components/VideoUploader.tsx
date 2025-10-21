import React, { useCallback, useState } from 'react';

interface VideoUploaderProps {
    onVideoUpload: (file: File) => void;
    title: string;
    description: string;
    accept?: string;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload, title, description, accept = 'video/*' }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onVideoUpload(e.target.files[0]);
        }
    };
    
    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const acceptedTypes = accept.split(',').map(t => t.trim());
            
            const isAccepted = acceptedTypes.some(type => {
                const normalizedType = type.replace(/\s/g, '');
                if (normalizedType.endsWith('/*')) {
                    return file.type.startsWith(normalizedType.slice(0, -1));
                }
                return file.type === normalizedType;
            });

            if (isAccepted) {
                onVideoUpload(file);
            }
        }
    }, [onVideoUpload, accept]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const uploaderId = `video-upload-${title.replace(/\s+/g, '-')}`;

    return (
        <div 
            className={`flex items-center justify-center w-full relative border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-500'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
        >
            <input
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id={uploaderId}
            />
            <label htmlFor={uploaderId} className="flex flex-col items-center justify-center text-center">
                 <svg className="w-12 h-12 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-purple-400">Click to upload {title}</span> or drag and drop</p>
                <p className="text-xs text-gray-500">{description}</p>
            </label>
        </div>
    );
};
