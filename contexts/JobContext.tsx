import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Job {
    id: string;
    title: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime: number;
    error?: string;
    type: 'SCAN' | 'REPORT' | 'ANALYSIS';
}

interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

interface JobContextType {
    jobs: Job[];
    activeJobsCount: number;
    startJob: <T>(title: string, task: () => Promise<T>, type?: Job['type']) => Promise<T>;
    confirmAction: (title: string, message: string, action: () => Promise<void>) => void;
    clearCompletedJobs: () => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [modalConfig, setModalConfig] = useState<ConfirmModalState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const activeJobsCount = jobs.filter(j => j.status === 'running').length;

    const startJob = useCallback(async <T,>(title: string, task: () => Promise<T>, type: Job['type'] = 'ANALYSIS'): Promise<T> => {
        const id = Math.random().toString(36).substr(2, 9);
        const newJob: Job = {
            id,
            title,
            status: 'running',
            startTime: Date.now(),
            type
        };

        setJobs(prev => [newJob, ...prev]);

        try {
            const result = await task();
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'completed' } : j));
            return result;
        } catch (error: any) {
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'failed', error: error.message } : j));
            throw error;
        }
    }, []);

    const confirmAction = useCallback((title: string, message: string, action: () => Promise<void>) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                // We wrap the action in a startJob call inside the component using this context? 
                // No, the caller should pass a wrapper or we call it here.
                // But the caller might want to await it. 
                // The requirement is "background process". So we don't await the action here.
                startJob(title, action, 'SCAN').catch(err => console.error("Background job failed", err));
            },
            onCancel: () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, [startJob]);

    const clearCompletedJobs = () => {
        setJobs(prev => prev.filter(j => j.status === 'running' || j.status === 'pending'));
    };

    return (
        <JobContext.Provider value={{ jobs, activeJobsCount, startJob, confirmAction, clearCompletedJobs }}>
            {children}

            {/* Confirmation Modal */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

                        <h3 className="text-xl font-bold text-white mb-2">{modalConfig.title}</h3>
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                            {modalConfig.message}
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={modalConfig.onCancel}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={modalConfig.onConfirm}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </JobContext.Provider>
    );
};

export const useJobContext = () => {
    const context = useContext(JobContext);
    if (!context) throw new Error('useJobContext must be used within a JobProvider');
    return context;
};
