import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HelmetProvider>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <UploadProvider>
                            <App />
                            <Toaster
                                position="bottom-right"
                                toastOptions={{
                                    className: 'dark:bg-dark-800 dark:text-white',
                                    duration: 4000,
                                }}
                            />
                        </UploadProvider>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </HelmetProvider>
    </React.StrictMode>
);
