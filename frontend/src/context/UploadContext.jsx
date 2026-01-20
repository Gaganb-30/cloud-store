/**
 * Upload Context
 * Manages chunked upload queue with progress, speed tracking, and cancellation
 */
import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { uploadApi } from '../api/upload';
import toast from 'react-hot-toast';

const UploadContext = createContext();

const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB chunks for speed

const initialState = {
    queue: [],
    uploading: false,
};

function uploadReducer(state, action) {
    switch (action.type) {
        case 'ADD_FILE':
            return {
                ...state,
                queue: [...state.queue, action.payload],
            };
        case 'UPDATE_FILE':
            return {
                ...state,
                queue: state.queue.map((f) => {
                    if (f.id !== action.payload.id) return f;
                    // Don't overwrite cancelled status (prevents race condition)
                    if (f.status === 'cancelled' && action.payload.status !== 'cancelled') {
                        return f;
                    }
                    return { ...f, ...action.payload };
                }),
            };
        case 'REMOVE_FILE':
            return {
                ...state,
                queue: state.queue.filter((f) => f.id !== action.payload),
            };
        case 'SET_UPLOADING':
            return { ...state, uploading: action.payload };
        case 'CLEAR_COMPLETED':
            return {
                ...state,
                queue: state.queue.filter((f) => f.status !== 'completed'),
            };
        case 'CLEAR_QUEUE':
            return {
                ...state,
                queue: [],
                uploading: false,
            };
        default:
            return state;
    }
}

// Calculate SHA-256 hash
async function calculateHash(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function UploadProvider({ children }) {
    const [state, dispatch] = useReducer(uploadReducer, initialState);
    const speedTrackerRef = useRef({});
    const abortControllersRef = useRef({});

    const addFile = useCallback((file, folderId = null) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const uploadItem = {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            folderId,
            progress: 0,
            speed: 0,
            eta: null,
            status: 'pending',
            sessionId: null,
            error: null,
        };
        dispatch({ type: 'ADD_FILE', payload: uploadItem });
        return id;
    }, []);

    const updateFile = useCallback((id, updates) => {
        dispatch({ type: 'UPDATE_FILE', payload: { id, ...updates } });
    }, []);

    const removeFile = useCallback((id) => {
        dispatch({ type: 'REMOVE_FILE', payload: id });
    }, []);

    // Cancel an ongoing upload and clean up server-side
    const cancelUpload = useCallback(async (id) => {
        // Abort the fetch request
        const controller = abortControllersRef.current[id];
        if (controller) {
            controller.abort();
            delete abortControllersRef.current[id];
        }
        delete speedTrackerRef.current[id];

        // Update UI immediately
        updateFile(id, { status: 'cancelled', error: 'Upload cancelled' });
        toast('Upload cancelled');

        // Find the session ID to clean up server-side
        const file = state.queue.find(f => f.id === id);
        if (file?.sessionId) {
            try {
                await uploadApi.abortUpload(file.sessionId);
            } catch (err) {
                // Ignore errors - server cleanup is best effort
                console.log('Server cleanup failed:', err.message);
            }
        }
    }, [updateFile, state.queue]);

    // Speed calculation helper
    const calculateSpeed = useCallback((id, bytesUploaded, totalBytes) => {
        const now = Date.now();
        const tracker = speedTrackerRef.current[id];

        if (!tracker) {
            speedTrackerRef.current[id] = {
                startTime: now,
                lastTime: now,
                lastBytes: bytesUploaded,
                samples: [],
            };
            return { speed: 0, eta: null };
        }

        const timeDiff = (now - tracker.lastTime) / 1000; // seconds
        if (timeDiff < 0.5) {
            return { speed: tracker.lastSpeed || 0, eta: tracker.lastEta || null };
        }

        const bytesDiff = bytesUploaded - tracker.lastBytes;
        const currentSpeed = bytesDiff / timeDiff;

        // Keep last 5 samples for smoothing
        tracker.samples.push(currentSpeed);
        if (tracker.samples.length > 5) tracker.samples.shift();

        const avgSpeed = tracker.samples.reduce((a, b) => a + b, 0) / tracker.samples.length;
        const remainingBytes = totalBytes - bytesUploaded;
        const eta = avgSpeed > 0 ? Math.ceil(remainingBytes / avgSpeed) : null;

        tracker.lastTime = now;
        tracker.lastBytes = bytesUploaded;
        tracker.lastSpeed = avgSpeed;
        tracker.lastEta = eta;

        return { speed: avgSpeed, eta };
    }, []);

    const uploadFile = useCallback(async (uploadItem) => {
        const { id, file } = uploadItem;

        // Create AbortController for this upload
        const abortController = new AbortController();
        abortControllersRef.current[id] = abortController;

        try {
            updateFile(id, { status: 'initializing' });

            // Check if cancelled
            if (abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            // Verify file is still readable
            try {
                await file.slice(0, 1).arrayBuffer();
            } catch (readError) {
                throw new Error('File is no longer accessible. Please re-select the file.');
            }

            // Calculate file hash (skip for very large files to save time)
            let fileHash = null;
            if (file.size < 100 * 1024 * 1024) { // Only hash files < 100MB
                fileHash = await calculateHash(file);
            }

            // Initialize upload session
            const session = await uploadApi.initUpload(
                file.name,
                file.size,
                fileHash,
                file.type,
                uploadItem.folderId
            );

            // Initialize speed tracker
            speedTrackerRef.current[id] = {
                startTime: Date.now(),
                lastTime: Date.now(),
                lastBytes: 0,
                samples: [],
            };

            updateFile(id, {
                sessionId: session.sessionId,
                status: 'uploading',
                totalChunks: session.totalChunks
            });

            // Upload chunks in PARALLEL for maximum speed
            const totalChunks = session.totalChunks;
            const PARALLEL_CHUNKS = 6; // Maximum concurrent chunk uploads
            let uploadedChunks = 0;
            let uploadedBytes = 0;

            // Helper function to upload a single chunk with retries
            const uploadSingleChunk = async (chunkIndex) => {
                // Check if cancelled
                if (abortController.signal.aborted) {
                    throw new Error('Upload cancelled');
                }

                const start = chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);
                const chunkBuffer = await chunk.arrayBuffer();
                const chunkSize = chunkBuffer.byteLength;

                // Retry logic
                let retries = 0;
                const maxRetries = 5;

                while (retries <= maxRetries) {
                    if (abortController.signal.aborted) {
                        throw new Error('Upload cancelled');
                    }

                    try {
                        await uploadApi.uploadChunk(
                            session.sessionId,
                            chunkIndex,
                            chunkBuffer
                        );
                        return chunkSize; // Return size for progress tracking
                    } catch (err) {
                        if (err.message.includes('Too many requests') && retries < maxRetries) {
                            retries++;
                            const waitTime = Math.pow(2, retries) * 1000;
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                            throw err;
                        }
                    }
                }
            };

            // Process chunks in parallel batches
            const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);

            // Process in batches of PARALLEL_CHUNKS
            for (let batchStart = 0; batchStart < totalChunks; batchStart += PARALLEL_CHUNKS) {
                if (abortController.signal.aborted) {
                    throw new Error('Upload cancelled');
                }

                const batchEnd = Math.min(batchStart + PARALLEL_CHUNKS, totalChunks);
                const batchIndices = chunkIndices.slice(batchStart, batchEnd);

                // Upload batch in parallel
                const batchResults = await Promise.all(
                    batchIndices.map(idx => uploadSingleChunk(idx))
                );

                // Update progress after batch completes
                uploadedChunks += batchResults.length;
                uploadedBytes += batchResults.reduce((sum, size) => sum + size, 0);
                const progress = Math.round((uploadedChunks / totalChunks) * 100);

                // Calculate speed
                const { speed, eta } = calculateSpeed(id, uploadedBytes, file.size);

                updateFile(id, {
                    progress,
                    uploadedChunks,
                    uploadedBytes,
                    speed,
                    eta,
                    status: 'uploading'
                });
            }

            // Complete upload
            updateFile(id, { status: 'completing' });
            const result = await uploadApi.completeUpload(session.sessionId);

            // Cleanup
            delete speedTrackerRef.current[id];
            delete abortControllersRef.current[id];

            updateFile(id, {
                status: 'completed',
                progress: 100,
                speed: 0,
                eta: null,
                fileId: result.fileId,
                downloadUrl: result.downloadUrl
            });

            toast.success(`${file.name} uploaded successfully!`);
            return result;
        } catch (error) {
            delete speedTrackerRef.current[id];
            delete abortControllersRef.current[id];

            // Don't show error toast for cancelled uploads
            if (error.message !== 'Upload cancelled') {
                updateFile(id, {
                    status: 'error',
                    error: error.message
                });
                toast.error(`Failed to upload ${file.name}: ${error.message}`);
            }
            throw error;
        }
    }, [updateFile, calculateSpeed]);

    const startUpload = useCallback(async () => {
        if (state.uploading) return;

        const pending = state.queue.filter((f) => f.status === 'pending');
        if (pending.length === 0) return;

        dispatch({ type: 'SET_UPLOADING', payload: true });

        for (const item of pending) {
            try {
                await uploadFile(item);
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        dispatch({ type: 'SET_UPLOADING', payload: false });
    }, [state.queue, state.uploading, uploadFile]);

    const clearCompleted = useCallback(() => {
        dispatch({ type: 'CLEAR_COMPLETED' });
    }, []);

    const clearQueue = useCallback(() => {
        // Cancel any ongoing uploads
        Object.keys(abortControllersRef.current).forEach(id => {
            abortControllersRef.current[id].abort();
        });
        abortControllersRef.current = {};
        speedTrackerRef.current = {};
        dispatch({ type: 'CLEAR_QUEUE' });
    }, []);

    const value = {
        queue: state.queue,
        uploading: state.uploading,
        addFile,
        removeFile,
        cancelUpload,
        startUpload,
        clearCompleted,
        clearQueue,
        hasUploads: state.queue.length > 0,
        pendingCount: state.queue.filter((f) => f.status === 'pending').length,
    };

    return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (!context) {
        throw new Error('useUpload must be used within UploadProvider');
    }
    return context;
}

export default UploadContext;
