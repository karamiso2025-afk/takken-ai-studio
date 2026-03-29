'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { DashboardView } from '@/components/DashboardView'
import { ContentView } from '@/components/ContentView'
import { QuizView } from '@/components/QuizView'
import { SettingsView } from '@/components/SettingsView'
import { AuthGate } from '@/components/AuthGate'

export type ViewType = 'dashboard' | 'content' | 'quiz' | 'settings'

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopicId(topicId)
    setCurrentView('content')
  }

  const handleContentGenerated = (contentId: string) => {
    setSelectedContentId(contentId)
  }

  return (
    <AuthGate>
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        onNavigate={setCurrentView}
        onTopicSelect={handleTopicSelect}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentView === 'dashboard' && (
            <DashboardView onTopicSelect={handleTopicSelect} />
          )}
          {currentView === 'content' && (
            <ContentView
              topicId={selectedTopicId}
              contentId={selectedContentId}
              onContentGenerated={handleContentGenerated}
            />
          )}
          {currentView === 'quiz' && <QuizView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
    </AuthGate>
  )
}
