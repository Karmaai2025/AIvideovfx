import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoUploader } from './components/VideoUploader';
import { VideoDisplay } from './components/VideoDisplay';
import { Loader } from './components/Loader';
import { ApiKeySelector } from './components/ApiKeySelector';
import { analyzeVideoAnimation, generateVideo } from './services/geminiService';
import { blobToBase64 } from './utils/blobToBase64';

const App: React.FC = () => {
    const [contentFile, setContentFile] = useState<File | null>(null);
    const [contentUrl, setContentUrl] = useState<string | null>(null);
    const [contentType, setContentType] = useState<'video' | 'image' | null>(null);
    const [contentBase64, setContentBase64] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

    const [referenceVideoFile, setReferenceVideoFile] = useState<File | null>(null);
    const [referenceVideoUrl, setReferenceVideoUrl] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

    const checkApiKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleContentUpload = async (file: File) => {
        setContentFile(file);
        const url = URL.createObjectURL(file);
        setContentUrl(url);
        setGeneratedVideoUrl(null);
        setError(null);
        
        if(file.type.startsWith('image/')) {
            setContentType('image');
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                setContentBase64(base64);
                const img = new Image();
                img.onload = () => {
                    setAspectRatio(img.width / img.height >= 1 ? '16:9' : '9:16');
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            };
            reader.readAsDataURL(file);
        } else {
             setContentType('video');
             const firstFrame = await extractFirstFrame(file);
             if(firstFrame) {
                 const base64 = await blobToBase64(firstFrame);
                 setContentBase64(base64.split(',')[1]);
                 const img = new Image();
                 img.onload = () => {
                     setAspectRatio(img.width / img.height >= 1 ? '16:9' : '9:16');
                 };
                 img.src = `data:image/jpeg;base64,${base64.split(',')[1]}`;
             }
        }
    };

    const handleReferenceVideoUpload = (file: File) => {
        setReferenceVideoFile(file);
        const url = URL.createObjectURL(file);
        setReferenceVideoUrl(url);
    };

    const extractVideoFrames = async (videoFile: File, frameCount: number): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                return reject(new Error('Failed to get canvas context'));
            }
            const frames: string[] = [];

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const duration = video.duration;
                if (duration <= 0) {
                    resolve([]);
                    return;
                }
                const interval = duration / frameCount;
                let currentTime = 0;
                let capturedFrames = 0;

                const captureFrame = () => {
                    video.currentTime = currentTime;
                };

                video.onseeked = () => {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    frames.push(frameDataUrl.split(',')[1]);
                    capturedFrames++;
                    currentTime += interval;

                    if (capturedFrames >= frameCount || currentTime > duration) {
                        video.pause();
                        URL.revokeObjectURL(video.src);
                        resolve(frames);
                    } else {
                        captureFrame();
                    }
                };
                
                video.play().then(() => {
                     captureFrame();
                }).catch(reject);
            };
            video.onerror = (e) => reject(new Error('Failed to load video metadata.'));
        });
    };
    
    const extractFirstFrame = async (videoFile: File): Promise<Blob | null> => {
         return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                return reject(new Error('Failed to get canvas context'));
            }
            
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                video.currentTime = 0;
            };

            video.onseeked = () => {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    URL.revokeObjectURL(video.src);
                    resolve(blob)
                }, 'image/jpeg', 0.9);
                video.pause();
            };
            
            video.play().catch(reject);
            video.onerror = (e) => reject(new Error('Failed to load video.'));
        });
    };

    const handleGenerate = async () => {
        if (!contentBase64 || !referenceVideoFile || isLoading) return;

        await checkApiKey();
        if (!apiKeySelected) {
            setError("Please select an API key before generating a video.");
             if(window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
                window.aistudio.openSelectKey();
            }
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            setLoadingMessage("Analyzing reference video animation...");
            const frames = await extractVideoFrames(referenceVideoFile, 10);
            if (frames.length === 0) {
                throw new Error("Could not extract frames from the reference video.");
            }
            const animationCommand = await analyzeVideoAnimation(frames);
            
            if(!animationCommand) {
                throw new Error("Could not determine animation style from the reference video.");
            }
            
            setLoadingMessage(`AI Command: "${animationCommand}". Generating video...`);
            const videoUrl = await generateVideo(contentBase64, animationCommand, setLoadingMessage, aspectRatio);
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
            console.error(err);
            if (err.message.includes("Requested entity was not found")) {
                setError("API key is invalid or expired. Please select a new key.");
                setApiKeySelected(false);
            } else {
                setError(`An error occurred: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true); // Assume success to avoid race condition
            setError(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Header />

                {!apiKeySelected && (
                    <ApiKeySelector onSelectKey={handleSelectKey} />
                )}

                <main className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl space-y-4">
                            <h2 className="text-xl font-bold text-center text-purple-300">1. Upload Content</h2>
                            <VideoUploader 
                              onVideoUpload={handleContentUpload} 
                              title="Image or Video"
                              description="Your source content for the animation"
                              accept="image/*,video/*"
                            />
                        </div>
                        
                        <div className={`bg-gray-800 p-6 rounded-2xl shadow-2xl space-y-4 transition-opacity duration-500 ${contentFile ? 'opacity-100' : 'opacity-50'}`}>
                            <h2 className="text-xl font-bold text-center text-purple-300">2. Upload Reference</h2>
                             <VideoUploader 
                              onVideoUpload={handleReferenceVideoUpload}
                              title="Reference Video"
                              description="A video with the animation style you want to replicate"
                              accept="video/*"
                            />
                        </div>
                    </div>

                    {contentFile && referenceVideoFile && (
                         <div className="flex justify-center pt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !apiKeySelected}
                                className="px-12 py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                            >
                                {isLoading ? 'Generating...' : 'Apply Animation'}
                            </button>
                        </div>
                    )}


                    {error && (
                        <div className="mt-6 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
                            <p>{error}</p>
                        </div>
                    )}

                    {isLoading && (
                       <Loader message={loadingMessage} />
                    )}

                    {!isLoading && (contentUrl || generatedVideoUrl) && (
                        <VideoDisplay 
                            contentUrl={contentUrl}
                            contentType={contentType}
                            referenceVideoUrl={referenceVideoUrl}
                            generatedVideoUrl={generatedVideoUrl}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;