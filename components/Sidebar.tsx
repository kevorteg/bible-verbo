
import React from 'react';
import { Book } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarBookList } from './sidebar/SidebarBookList';
import { SidebarModeMenu } from './sidebar/SidebarModeMenu';
import { SidebarFooter } from './sidebar/SidebarFooter';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  bibleId: string;
  setBibleId: (id: string) => void;
  apiBooks: Book[];
  currentBook: Book | null;
  onSelectBook: (book: Book) => void;
  onOpenAuth: () => void;
  onNavigateToProfile: () => void;
  onNavigateToMap: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToLeaders: () => void;
  onNavigateToGames: () => void;
  currentView: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen, onClose, theme, bibleId, setBibleId, apiBooks, currentBook, onSelectBook, onOpenAuth, onNavigateToProfile, onNavigateToMap, onNavigateToAdmin, onNavigateToLeaders, onNavigateToGames, currentView
}) => {
  const { user, logout } = useAuth();

  const containerClasses = theme === 'dark'
    ? 'bg-[#0d1e3a] border-blue-900/40 shadow-2xl'
    : theme === 'sepia'
      ? 'bg-[#f4ecd8] border-[#e2d5b6] shadow-xl'
      : 'bg-white border-neutral-200 shadow-2xl';

  const textClasses = theme === 'dark' ? 'text-white' : (theme === 'sepia' ? 'text-[#5b4636]' : 'text-neutral-900');

  const inputClasses = theme === 'dark'
    ? 'bg-[#0a192f] border-blue-800/40 text-white placeholder:text-neutral-500'
    : theme === 'sepia'
      ? 'bg-[#eaddcf] border-[#d3c4b1] text-[#5b4636] placeholder:text-[#8c735a]'
      : 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400';

  const selectClasses = theme === 'dark'
    ? 'bg-[#1a2d4d] border-blue-800/40 text-orange-500'
    : theme === 'sepia'
      ? 'bg-[#eaddcf] border-[#d3c4b1] text-orange-600'
      : 'bg-neutral-100 border-neutral-200 text-orange-600';

  const showBooks = currentView === 'reader';
  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'leader';

  return (
    <aside className={`fixed inset-y-0 left-0 z-[50] flex flex-col border-r transition-all duration-300 transform 
        ${isOpen ? 'translate-x-0 w-72 lg:relative lg:translate-x-0' : '-translate-x-full w-0 overflow-hidden border-none lg:w-0'} 
        ${containerClasses}`}>

      <SidebarHeader onClose={onClose} textClasses={textClasses} />

      {showBooks ? (
        <SidebarBookList
          bibleId={bibleId}
          setBibleId={setBibleId}
          apiBooks={apiBooks}
          currentBook={currentBook}
          onSelectBook={onSelectBook}
          theme={theme}
          textClasses={textClasses}
          inputClasses={inputClasses}
          selectClasses={selectClasses}
        />
      ) : (
        <SidebarModeMenu
          currentView={currentView}
          onBackToReader={() => onSelectBook(currentBook || apiBooks[0])}
          theme={theme}
          textClasses={textClasses}
        />
      )}

      <SidebarFooter
        isAdminOrLeader={isAdminOrLeader || false}
        onNavigateToAdmin={onNavigateToAdmin}
        user={user}
        onNavigateToProfile={onNavigateToProfile}
        onOpenAuth={onOpenAuth}
        onNavigateToMap={onNavigateToMap}
        onNavigateToLeaders={onNavigateToLeaders}
        onNavigateToGames={onNavigateToGames}
        currentView={currentView}
        theme={theme}
        textClasses={textClasses}
        onLogout={logout}
      />
    </aside>
  );
};

export default Sidebar;
