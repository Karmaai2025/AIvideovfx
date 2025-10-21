import React from 'react';

interface VideoDisplayProps {
    contentUrl: string | null;
    contentType: 'video' | 'image' | null;
    referenceVideoUrl: string | null;
    generatedVideoUrl: string | null;
}

const MediaPreview: React.FC<{ src: string, title: string, filename: string, type: 'video' | 'image' }> = ({ src, title, filename, type }) => (
    <div className="flex flex-col items-center bg-gray-800 p-4 rounded-xl shadow-lg w-full">
        <h3 className="text-lg font-semibold mb-3 text-gray-300">{title}</h3>
        {type === 'video' ? (
             <video src={src} controls loop className="w-full rounded-lg aspect-video object-cover bg-black" />
        ) : (
            <img src={src} alt={title} className="w-full rounded-lg aspect-video object-cover bg-black" />
        )}
       
        <a
            href={src}
            download={filename}
            className="mt-4 w-full text-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-300"
        >
            Download
        </a>
    </div>
);


export const VideoDisplay: React.FC<VideoDisplayProps> = ({ contentUrl, contentType, referenceVideoUrl, generatedVideoUrl }) => {
    const hasAllThree = contentUrl && referenceVideoUrl && generatedVideoUrl;
    const gridCols = hasAllThree ? 'md:grid-cols-3' : 'md:grid-cols-2';

    return (
        <div className={`mt-8 grid grid-cols-1 ${gridCols} gap-6`}>
            {contentUrl && contentType && (
                <MediaPreview 
                    src={contentUrl} 
                    title="Original Content" 
                    filename={contentType === 'video' ? 'original_video.mp4' : 'original_image.jpg'}
                    type={contentType} 
                />
            )}
            {referenceVideoUrl && (
                 <MediaPreview 
                    src={referenceVideoUrl} 
                    title="Reference Video" 
                    filename="reference_video.mp4"
                    type="video"
                />
            )}
            {generatedVideoUrl && (
                <MediaPreview 
                    src={generatedVideoUrl} 
                    title="AI Generated Video" 
                    filename="generated_video.mp4" 
                    type="video"
                />
            )}
        </div>
    );
};