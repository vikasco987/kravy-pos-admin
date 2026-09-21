import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Info, DownloadCloud, CheckCircle2, RotateCw } from 'lucide-react';

export default function Settings() {
    const [appVersion, setAppVersion] = useState<string>('Loading...');
    const [appName, setAppName] = useState<string>('Loading...');
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloaded'>('idle');

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.getAppVersion().then(setAppVersion).catch(console.error);
            window.electronAPI.getAppName().then(setAppName).catch(console.error);

            window.electronAPI.onUpdateAvailable(() => {
                setUpdateStatus('available');
            });

            window.electronAPI.onUpdateDownloaded(() => {
                setUpdateStatus('downloaded');
            });
        }
    }, []);

    const handleCheckUpdate = () => {
        if (window.electronAPI) {
            setUpdateStatus('checking');
            window.electronAPI.checkForUpdates().catch((err) => {
                console.error("Update check failed (expected in dev mode)", err);
                // Revert to idle after a short delay so the button isn't stuck if it fails
                setTimeout(() => setUpdateStatus('idle'), 2000);
            });
        } else {
            alert('Updates are only available in the desktop app.');
        }
    };

    const handleInstallUpdate = () => {
        if (window.electronAPI) {
            window.electronAPI.installUpdate().catch(console.error);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto font-['Outfit']">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage application preferences and updates</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* App Information Card */}
                <div className="bg-white dark:bg-[#1A1A2E] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Info className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">About Application</h2>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Application Name</p>
                            <p className="text-gray-900 dark:text-gray-200 font-semibold">{appName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Version</p>
                            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                v{appVersion}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Features</p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                <li>Cloud Sync Integration</li>
                                <li>Point of Sale Tools</li>
                                <li>Real-time Updates</li>
                                <li>Dark Mode Support</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Auto Update Card */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <DownloadCloud className="w-6 h-6 text-blue-100" />
                            <h2 className="text-xl font-bold text-white">System Update</h2>
                        </div>
                        
                        <p className="text-blue-100 text-sm mb-8 leading-relaxed">
                            Keep your application up to date with the latest features, security patches, and performance improvements.
                        </p>

                        <div className="bg-black/20 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                            {updateStatus === 'idle' && (
                                <div className="text-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                    <p className="font-semibold mb-4 text-sm text-blue-50">App is up to date</p>
                                    <button 
                                        onClick={handleCheckUpdate}
                                        className="w-full py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                                    >
                                        Check for Updates
                                    </button>
                                </div>
                            )}

                            {updateStatus === 'checking' && (
                                <div className="text-center py-4">
                                    <RotateCw className="w-8 h-8 text-white mx-auto mb-3 animate-spin" />
                                    <p className="font-semibold text-sm text-blue-50">Checking for updates...</p>
                                </div>
                            )}

                            {updateStatus === 'available' && (
                                <div className="text-center py-4">
                                    <DownloadCloud className="w-8 h-8 text-blue-200 mx-auto mb-3 animate-bounce" />
                                    <p className="font-semibold text-sm text-blue-50">Downloading update in background...</p>
                                </div>
                            )}

                            {updateStatus === 'downloaded' && (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="font-bold text-base text-white mb-1">Update Ready!</p>
                                    <p className="text-xs text-blue-100 mb-4">A new version has been downloaded.</p>
                                    <button 
                                        onClick={handleInstallUpdate}
                                        className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors shadow-md"
                                    >
                                        Restart & Install
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
