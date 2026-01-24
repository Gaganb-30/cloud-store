/**
 * Upload Context
 * Manages chunked upload queue with progress, speed tracking, and cancellation
 */
import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { uploadApi } from '../api/upload';
import toast from 'react-hot-toast';

const UploadContext = createContext();

const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB chunks for speed

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === -1) return 'Unlimited';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

// Parse and format upload error messages for better UX
function formatUploadError(error, filename) {
    // Backend returns { error: { message, code } } format
    const errorData = error?.response?.data?.error || error?.response?.data || {};
    const message = errorData?.message || error?.response?.data?.message || error?.message || 'Upload failed';
    const code = errorData?.code || '';

    // File too large error (check code first, then message)
    if (code === 'VALIDATION_ERROR' && message.includes('exceeds maximum size')) {
        return `File size limit exceeded. Free accounts can upload files up to 10 GB. Upgrade to Premium for unlimited file sizes.`;
    }

    if (message.includes('FILE_TOO_LARGE') || message.includes('exceeds maximum size')) {
        return `File size limit exceeded. Free accounts can upload files up to 10 GB. Upgrade to Premium for unlimited file sizes.`;
    }

    // Storage quota exceeded
    if (message.includes('STORAGE_EXCEEDED') || message.includes('exceed storage quota') || message.includes('storage quota')) {
        return `Storage limit of 25 GB exceeded. Delete some files or upgrade to Premium for unlimited storage.`;
    }

    // File count exceeded
    if (message.includes('FILE_COUNT_EXCEEDED') || message.includes('file count')) {
        return 'Maximum file count reached. Delete some files or upgrade to Premium.';
    }

    // Quota check failed
    if (message.includes('quota check') || message.includes('Upload not allowed')) {
        return 'Upload not allowed. Check your account storage limits.';
    }

    // Return the backend message directly if it's descriptive
    if (message && message !== 'Upload failed' && !message.includes('status code')) {
        return message;
    }

    return 'Upload failed. Please try again.';
}

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
    const sessionIdsRef = useRef({}); // Track file id -> session id mapping

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

        // Get session ID from ref (more reliable than state)
        const sessionId = sessionIdsRef.current[id];
        if (sessionId) {
            try {
                await uploadApi.abortUpload(sessionId);
                console.log('Server cleanup successful for session:', sessionId);
            } catch (err) {
                console.log('Server cleanup failed:', err.message);
            }
            delete sessionIdsRef.current[id];
        }
    }, [updateFile]);

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

    // Proxied upload (through backend) - for local storage or when hiding R2 is critical
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

            // Store sessionId in ref for reliable cancel cleanup
            sessionIdsRef.current[id] = session.sessionId;

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

                // Throttle UI updates to every 1 second (or on final batch)
                const tracker = speedTrackerRef.current[id];
                const now = Date.now();
                const timeSinceLastUIUpdate = now - (tracker.lastUIUpdate || 0);
                const isFinalBatch = batchEnd >= totalChunks;

                if (timeSinceLastUIUpdate >= 1000 || isFinalBatch || !tracker.lastUIUpdate) {
                    tracker.lastUIUpdate = now;
                    updateFile(id, {
                        progress,
                        uploadedChunks,
                        uploadedBytes,
                        speed,
                        eta,
                        status: 'uploading'
                    });
                }
            }

            // Complete upload
            updateFile(id, { status: 'completing' });
            const result = await uploadApi.completeUpload(session.sessionId);

            // Cleanup
            delete speedTrackerRef.current[id];
            delete abortControllersRef.current[id];
            delete sessionIdsRef.current[id];

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
            delete sessionIdsRef.current[id];

            // Don't show error toast for cancelled uploads
            if (error.message !== 'Upload cancelled') {
                updateFile(id, {
                    status: 'error',
                    error: error.message
                });
                toast.error(formatUploadError(error, file.name));
            }
            throw error;
        }
    }, [updateFile, calculateSpeed]);

    // R2 Direct Upload using presigned URLs (FAST - uploads directly to R2)
    const uploadFileR2 = useCallback(async (uploadItem) => {
        const { id, file } = uploadItem;

        // Create AbortController for this upload
        const abortController = new AbortController();
        abortControllersRef.current[id] = abortController;

        try {
            updateFile(id, { status: 'initializing' });

            // Verify file is still readable
            try {
                await file.slice(0, 1).arrayBuffer();
            } catch (readError) {
                throw new Error('File is no longer accessible. Please re-select the file.');
            }

            // Initialize R2 multipart upload (gets presigned URLs)
            const session = await uploadApi.initR2Upload(
                file.name,
                file.size,
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

            sessionIdsRef.current[id] = session.sessionId;

            updateFile(id, {
                sessionId: session.sessionId,
                status: 'uploading',
                totalChunks: session.totalParts
            });

            // Upload parts directly to R2 using presigned URLs IN PARALLEL for maximum speed
            const totalParts = session.totalParts;
            const partSize = session.partSize;
            const PARALLEL_PARTS = 4; // Upload 4 parts concurrently for speed

            // Track results and progress
            const partResults = new Array(totalParts);
            const partProgress = new Array(totalParts).fill(0);
            let completedParts = 0;

            // Helper to calculate total uploaded bytes from all parts
            const calculateTotalProgress = () => {
                return partProgress.reduce((sum, bytes) => sum + bytes, 0);
            };

            // Upload a single part
            const uploadPart = async (partIndex) => {
                if (abortController.signal.aborted) {
                    throw new Error('Upload cancelled');
                }

                const start = partIndex * partSize;
                const end = Math.min(start + partSize, file.size);
                const partData = file.slice(start, end);
                const partBuffer = await partData.arrayBuffer();
                const partSizeBytes = partBuffer.byteLength;

                // Upload directly to R2 using presigned URL with progress tracking
                const { etag } = await uploadApi.uploadPartToR2(
                    session.presignedUrls[partIndex].url,
                    partBuffer,
                    // Progress callback for this part
                    (loadedInPart, totalInPart) => {
                        partProgress[partIndex] = loadedInPart;

                        // Calculate total progress across all parts
                        const totalUploaded = calculateTotalProgress();
                        const progress = Math.round((totalUploaded / file.size) * 100);
                        const { speed, eta } = calculateSpeed(id, totalUploaded, file.size);

                        // Throttle UI updates to every 300ms
                        const tracker = speedTrackerRef.current[id];
                        if (!tracker) return;

                        const now = Date.now();
                        const timeSinceLastUIUpdate = now - (tracker.lastUIUpdate || 0);

                        if (timeSinceLastUIUpdate >= 300 || !tracker.lastUIUpdate) {
                            tracker.lastUIUpdate = now;
                            updateFile(id, {
                                progress,
                                uploadedChunks: completedParts,
                                uploadedBytes: totalUploaded,
                                speed,
                                eta,
                                status: 'uploading'
                            });
                        }
                    }
                );

                // Mark part as complete
                partProgress[partIndex] = partSizeBytes;
                partResults[partIndex] = etag;
                completedParts++;

                // Update UI on part completion
                const totalUploaded = calculateTotalProgress();
                const progress = Math.round((totalUploaded / file.size) * 100);
                const { speed, eta } = calculateSpeed(id, totalUploaded, file.size);
                const tracker = speedTrackerRef.current[id];
                if (tracker) tracker.lastUIUpdate = Date.now();

                updateFile(id, {
                    progress,
                    uploadedChunks: completedParts,
                    uploadedBytes: totalUploaded,
                    speed,
                    eta,
                    status: 'uploading'
                });

                return etag;
            };

            // Upload parts in parallel batches
            for (let batchStart = 0; batchStart < totalParts; batchStart += PARALLEL_PARTS) {
                if (abortController.signal.aborted) {
                    throw new Error('Upload cancelled');
                }

                const batchEnd = Math.min(batchStart + PARALLEL_PARTS, totalParts);
                const batchPromises = [];

                for (let i = batchStart; i < batchEnd; i++) {
                    batchPromises.push(uploadPart(i));
                }

                // Wait for batch to complete
                await Promise.all(batchPromises);
            }

            // Get etags in order for multipart completion
            const etags = partResults;

            // Complete multipart upload
            updateFile(id, { status: 'completing' });
            const result = await uploadApi.completeR2Upload(session.sessionId, etags);

            // Cleanup
            delete speedTrackerRef.current[id];
            delete abortControllersRef.current[id];
            delete sessionIdsRef.current[id];

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

            // Try to abort R2 upload on error
            const sessionId = sessionIdsRef.current[id];
            if (sessionId) {
                try {
                    await uploadApi.abortR2Upload(sessionId);
                } catch (e) {
                    console.log('R2 abort failed:', e.message);
                }
                delete sessionIdsRef.current[id];
            }

            if (error.message !== 'Upload cancelled') {
                updateFile(id, {
                    status: 'error',
                    error: error.message
                });
                toast.error(formatUploadError(error, file.name));
            }
            throw error;
        }
    }, [updateFile, calculateSpeed]);

    const startUpload = useCallback(async () => {
        if (state.uploading) return;

        const pending = state.queue.filter((f) => f.status === 'pending');
        if (pending.length === 0) return;

        dispatch({ type: 'SET_UPLOADING', payload: true });

        // Check storage provider - use R2 direct upload if available (faster)
        let isR2 = false;
        try {
            const storageInfo = await uploadApi.getStorageInfo();
            isR2 = storageInfo.isR2;
        } catch (e) {
            console.log('Could not get storage info, using proxied upload');
        }

        for (const item of pending) {
            try {
                if (isR2) {
                    await uploadFileR2(item);
                } else {
                    await uploadFile(item);
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }

        dispatch({ type: 'SET_UPLOADING', payload: false });
    }, [state.queue, state.uploading, uploadFile, uploadFileR2]);

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
