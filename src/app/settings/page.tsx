'use client';

import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Calendar, Download, Upload, Database, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  exportUserData,
  downloadBackup,
  validateBackupData,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  getLocalStorageSize,
  formatStorageSize,
  DATA_VERSION
} from '@/lib/utils/data-management';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function SettingsPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [localStorageSize, setLocalStorageSize] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorageSize(getLocalStorageSize());
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-lg text-indigo-600 dark:text-indigo-300">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      const backupData = await exportUserData(user.uid);
      downloadBackup(backupData);
      setSuccess('Data exported successfully!');
    } catch (error) {
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateBackupData(data)) {
        throw new Error('Invalid backup file format');
      }

      if (data.version !== DATA_VERSION) {
        throw new Error('Backup version mismatch');
      }

      // Save to localStorage as backup
      const success = saveToLocalStorage('lifelog_backup', data);
      if (!success) {
        throw new Error('Failed to save backup to local storage');
      }

      setSuccess('Backup imported and saved to local storage successfully!');
      setLocalStorageSize(getLocalStorageSize());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to import backup');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleClearLocalStorage = () => {
    try {
      clearLocalStorage('lifelog_backup');
      setSuccess('Local storage cleared successfully!');
      setLocalStorageSize(getLocalStorageSize());
    } catch (error) {
      setError('Failed to clear local storage');
    }
    setShowConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950 py-8">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard')}
            className="hover:bg-indigo-100 dark:hover:bg-indigo-900"
          >
            <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </Button>
          <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
            Settings
          </h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-200">Error</AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <AlertTitle className="text-green-800 dark:text-green-200">Success</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border-l-4 border-indigo-500 dark:border-indigo-400">
            <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-4">Appearance</h2>
            <ThemeToggle />
          </div>

          <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-indigo-500 dark:border-indigo-400 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
                <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">
                  Profile Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your personal details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="font-medium text-indigo-700 dark:text-indigo-300">
                    {user.displayName || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-indigo-700 dark:text-indigo-300">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Account Created
                  </p>
                  <p className="font-medium text-indigo-700 dark:text-indigo-300">
                    {user.metadata.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border-l-4 border-indigo-500 dark:border-indigo-400 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-200 via-purple-200 to-blue-200 dark:from-indigo-900 dark:via-purple-900 dark:to-blue-900 flex items-center justify-center">
                <Database className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">
                  Data Management
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export, import, and manage your data
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium text-indigo-700 dark:text-indigo-300">Export Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download a backup of your journal entries
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium text-indigo-700 dark:text-indigo-300">Import Data</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Restore from a backup file
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-file"
                    disabled={isImporting}
                  />
                  <Button
                    variant="default"
                    onClick={() => document.getElementById('import-file')?.click()}
                    disabled={isImporting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isImporting ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="font-medium text-indigo-700 dark:text-indigo-300">Local Storage</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Current size: {formatStorageSize(localStorageSize)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(true)}
                  className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-white dark:bg-gray-800 border-l-4 border-indigo-500 dark:border-indigo-400">
            <DialogHeader>
              <DialogTitle className="text-indigo-700 dark:text-indigo-300">Clear Local Storage</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to clear all locally stored backup data? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearLocalStorage}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Clear Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
