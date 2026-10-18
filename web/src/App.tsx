import React, { useState, useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { api } from './services/api';
import type { Task, Project, FocusStats } from './types';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/ToastContainer';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { DashboardView } from './components/DashboardView';
import { FocusTimer } from './components/FocusTimer';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { AnalyticsView } from './components/AnalyticsView';

import { RegisterJourney } from './components/RegisterJourney';
import { SettingsSidebar } from './components/SettingsSidebar';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export const App: React.FC = () => {
  useKeyboardShortcuts();

  const {
    user,
    token,
    setUser,
    activeTab,
    setActiveSession,
    isZenMode,
  } = useStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<FocusStats | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const lastSyncTimeRef = useRef<string>('');

  const refreshAllData = React.useCallback(async () => {
    if (!token) return;
    try {
      const [tList, pList, fStats, currentSession] = await Promise.all([
        api.listTasks(),
        api.listProjects(),
        api.getFocusStats(),
        api.getCurrentFocusSession(),
      ]);
      setTasks(tList);
      setProjects(pList);
      setStats(fStats);
      setActiveSession(currentSession || null);
      lastSyncTimeRef.current = new Date().toISOString();
    } catch {
      // ignore
    }
  }, [token, setActiveSession]);

  useEffect(() => {
    const initialize = async () => {
      if (token) {
        try {
          const me = await api.getMe();
          setUser(me);
          await refreshAllData();
        } catch {
          setUser(null);
        }
      }
    };

    initialize();
  }, [token, setUser, refreshAllData]);

  // Background Delta Sync (every 10s)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const lastSync = lastSyncTimeRef.current || new Date(0).toISOString();
        const now = new Date().toISOString();

        const deltaTasks = await api.listTasks({ updated_after: lastSync });
        if (deltaTasks.length > 0) {
          setTasks((prev) => {
            const map = new Map(prev.map((t) => [t.id, t]));
            deltaTasks.forEach((t) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }

        const deltaProjects = await api.listProjects({ updated_after: lastSync });
        if (deltaProjects.length > 0) {
          setProjects((prev) => {
            const map = new Map(prev.map((p) => [p.id, p]));
            deltaProjects.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }

        const latestStats = await api.getFocusStats();
        setStats(latestStats);

        lastSyncTimeRef.current = now;
      } catch {
        // quiet fail on background sync
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="min-h-screen bg-white dark:bg-black light:bg-canvas text-white dark:text-white light:text-black transition-colors flex flex-col font-sans">
      <ToastContainer />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />
      <RegisterJourney
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => setIsAuthOpen(true)}
      />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenProfile={() => {
          setIsSettingsOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenAuth={() => {
          setIsSettingsOpen(false);
          setIsAuthOpen(true);
        }}
        onOpenRegister={() => {
          setIsSettingsOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {!isZenMode && !isRegisterOpen && (
        <Navbar
          projects={projects}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen((prev) => !prev)}
        />
      )}

      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            tasks={tasks}
            projects={projects}
            stats={stats}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'focus' && (
          <div className="py-8">
            <FocusTimer
              tasks={tasks}
              onSessionFinished={refreshAllData}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            projects={projects}
            onRefresh={refreshAllData}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            tasks={tasks}
            onRefresh={refreshAllData}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            stats={stats}
            tasks={tasks}
            projects={projects}
            onRefresh={refreshAllData}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
