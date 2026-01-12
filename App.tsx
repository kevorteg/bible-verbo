
import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { Bookmark as BookmarkType, NoteMap } from './types';
import * as UserService from './services/userService';
import Sidebar from './components/Sidebar';
import Reader from './components/Reader';
import RightPanel from './components/RightPanel';
import ShareModal from './components/ShareModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import ProfilePage from './components/ProfilePage';
import MapPage from './components/MapPage';
import AdminDashboard from './components/AdminDashboard';
import { LeaderTools } from './components/LeaderTools';
import { ToastNotification } from './components/ToastNotification';
import { useBibleReader } from './hooks/useBibleReader';
import { useChat } from './hooks/useChat';
import { useQuiz } from './hooks/useQuiz';
import * as GeminiService from './services/geminiService'; // For direct calls if any remaining
import { GamesPage } from './components/GamesPage';

// Wraps the main content to provide auth context cleanly
const AppContent = () => {
  const { user, updateStats } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [currentView, setCurrentView] = useState<'reader' | 'dashboard' | 'map' | 'admin' | 'leaders' | 'games'>('reader');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref para controlar que la sincronización solo ocurra una vez por sesión
  const hasSyncedRef = useRef(false);

  const [selectedVerse, setSelectedVerse] = useState<any | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [notes, setNotes] = useState<NoteMap>({});
  const [showChapterGrid, setShowChapterGrid] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("'Crimson Text', serif");
  const [activeTab, setActiveTab] = useState('ia');
  const [inputMessage, setInputMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- HOOKS CUSTOMIZADOS ---
  const bible = useBibleReader(showToast);
  const {
    bibleId, setBibleId, apiBooks, currentBook, setCurrentBook,
    currentChapter, setCurrentChapter, chaptersList, verses, loading,
    highlightedVerseId, setHighlightedVerseId, readChapters,
    handleNextChapter, handlePrevChapter, handleToggleReadChapter
  } = bible;

  const quiz = useQuiz(currentBook, currentChapter, verses, showToast);

  // --- LOGICA DE NAVEGACION Y BUSQUEDA (detectAndNavigate) ---
  // Se mantiene aquí porque orquesta cambios en el hook de biblia y vista
  const detectAndNavigate = (text: string) => {
    // Limpiamos markdown y caracteres extraños
    const cleanText = text.replace(/[*_#]/g, '').trim();
    const bibleRegex = /([123]?\s?[a-z0-9áéíóúñ]+\s*[a-záéíóúñ]*)\s*(\d+)(?::(\d+))?/i;
    const match = cleanText.match(bibleRegex);

    if (match && apiBooks.length > 0) {
      const rawBookName = match[1].toLowerCase().trim();
      const normalizedQuery = rawBookName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Evitamos falsos positivos con palabras de 1 letra (ej: "y 3")
      if (normalizedQuery.length < 2) return;

      const chapterNum = parseInt(match[2]);
      const verseNum = match[3] ? parseInt(match[3]) : null;

      const foundBook = apiBooks.find(b => {
        const normalizedBookName = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        // 1. Coincidencia exacta del ID
        if (b.id.toLowerCase() === rawBookName) return true;
        // 2. El nombre del libro contiene la query (pero la query debe ser relevante)
        return normalizedBookName.includes(normalizedQuery);
      });

      if (foundBook) {
        showToast(`Yendo a ${foundBook.name} ${chapterNum}${verseNum ? ':' + verseNum : ''}...`);
        setCurrentView('reader');
        if (verseNum) (window as any)._pendingVerse = verseNum;
        if (currentBook && foundBook.id === currentBook.id) {
          const targetChapter = chaptersList.find(c => parseInt(c.number) === chapterNum);
          if (targetChapter) {
            if (currentChapter && targetChapter.id === currentChapter.id) {
              if (verseNum) {
                setHighlightedVerseId(String(verseNum));
                delete (window as any)._pendingVerse;
              }
            } else {
              setCurrentChapter(targetChapter);
            }
          } else {
            (window as any)._pendingChapter = chapterNum;
          }
        } else {
          setCurrentBook(foundBook);
          (window as any)._pendingChapter = chapterNum;
        }
        if (window.innerWidth < 1024) { setSidebarOpen(false); setRightPanelOpen(false); }
      }
    }
  };

  const chat = useChat(user, detectAndNavigate, setCurrentView, setSidebarOpen);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
      setRightPanelOpen(true);
    }
    if (!(window as any).html2canvas) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.async = true;
      document.head.appendChild(script);
    }

    const savedTheme = localStorage.getItem('verbo_theme');
    if (savedTheme) setTheme(savedTheme as any);

    if (!user) {
      const savedBookmarks = localStorage.getItem('verbo_bookmarks_final');
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
      const savedNotes = localStorage.getItem('verbo_notes_final');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      hasSyncedRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    const syncUserData = async () => {
      if (user && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        showToast("Sincronizando datos...");
        try {
          const dbNotes = await UserService.syncNotes(user.id);
          setNotes(dbNotes);
          const dbBookmarks = await UserService.syncBookmarks(user.id);
          setBookmarks(dbBookmarks);
          // Chat history sync moved to useChat
        } catch (e) {
          console.error("Error syncing user data", e);
        }
      } else if (!user) {
        setNotes({});
        setBookmarks([]);
        setCurrentView('reader');
      }
    };
    syncUserData();
  }, [user]);

  const toggleBookmark = async (v: any) => {
    const exists = bookmarks.find(b => b.id === v.id);
    let updated;
    const newBookmark: BookmarkType = exists ? (v as BookmarkType) : {
      ...v,
      bookName: currentBook?.name || '',
      chapterNum: currentChapter?.number || ''
    };
    if (exists) updated = bookmarks.filter(b => b.id !== v.id);
    else updated = [...bookmarks, newBookmark];

    setBookmarks(updated);
    if (user) await UserService.toggleBookmark(user.id, newBookmark, !exists);
    else localStorage.setItem('verbo_bookmarks_final', JSON.stringify(updated));
  };

  const saveNote = async (content: string, specificId?: string) => {
    const targetId = specificId || selectedVerse?.id;
    if (!targetId) return;
    const updated = { ...notes, [targetId]: content };
    setNotes(updated);
    if (user) await UserService.saveNote(user.id, targetId, content);
    else localStorage.setItem('verbo_notes_final', JSON.stringify(updated));
    if (user && user.stats && content.length > 5) updateStats({ notesCount: user.stats.notesCount + 1 });
  };

  const handleSendMessageWrapper = async (customText?: string, isStudy: boolean = false, location?: { latitude: number, longitude: number }) => {
    setActiveTab('ia');
    await chat.sendMessage(
      customText || inputMessage,
      selectedVerse,
      currentBook,
      currentChapter,
      isStudy,
      location
    );
    if (!customText) setInputMessage('');
  };

  const renderContent = () => {
    const containerClass = "flex-1 relative overflow-hidden flex flex-col";

    if (currentView === 'dashboard' && user) {
      return (
        <div className={containerClass}>
          <ProfilePage
            user={user}
            theme={theme}
            notes={notes}
            bookmarks={bookmarks}
            chatHistory={chat.chatMessages}
            onNavigateToLocation={(loc) => detectAndNavigate(loc)}
            onBackToReader={() => setCurrentView('reader')}
            onNavigateToAdmin={() => setCurrentView('admin')}
            onNavigateToLeaders={() => setCurrentView('leaders')}
          />
        </div>
      );
    }

    if (currentView === 'map') {
      return (
        <div className={containerClass}>
          <MapPage
            theme={theme}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>
      );
    }



    if (currentView === 'leaders') {
      return (
        <div className={containerClass}>
          <LeaderTools
            theme={theme}
            onBack={() => setCurrentView('reader')}
            currentBook={currentBook}
            currentChapter={currentChapter}
          />
        </div>
      );
    }

    if (currentView === 'games') {
      return (
        <GamesPage
          onBack={() => setCurrentView('reader')}
          onStartQuiz={() => {
            setRightPanelOpen(true);
            if (activeTab !== 'quiz') setActiveTab('quiz');
          }}
          theme={theme}
        />
      );
    }

    return (
      <Reader
        currentBook={currentBook}
        currentChapter={currentChapter}
        verses={verses}
        chaptersList={chaptersList}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onSelectChapter={setCurrentChapter}
        loading={loading}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        showChapterGrid={showChapterGrid}
        setShowChapterGrid={setShowChapterGrid}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        selectedVerse={selectedVerse}
        setSelectedVerse={setSelectedVerse}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
        highlightedVerseId={highlightedVerseId}
        onClearHighlight={() => setHighlightedVerseId(null)}
        readChapters={readChapters}
        onToggleReadChapter={handleToggleReadChapter}
        onStartQuiz={() => {
          setRightPanelOpen(true);
          setActiveTab('quiz');
          quiz.setTopic('aplicacion');
        }}
      />
    );
  };

  if (currentView === 'admin' && user && (user.role === 'admin' || user.role === 'leader')) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0a192f] w-screen h-screen">
        <AdminDashboard
          currentUser={user}
          theme={theme}
          onBack={() => setCurrentView('reader')}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 overflow-hidden ${theme === 'dark' ? 'bg-[#0a192f] text-neutral-100' : (theme === 'sepia' ? 'bg-[#f4ecd8] text-[#5b4636]' : 'bg-neutral-50 text-neutral-900')}`}>

      <ToastNotification
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        theme={theme}
      />

      {(sidebarOpen || rightPanelOpen) && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden" onClick={() => { setSidebarOpen(false); setRightPanelOpen(false); }} />}

      {selectedVerse && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          verse={selectedVerse}
          book={currentBook}
          chapter={currentChapter}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        theme={theme}
        bibleId={bibleId}
        setBibleId={setBibleId}
        apiBooks={apiBooks}
        currentBook={currentBook}
        onSelectBook={(book) => {
          setCurrentBook(book);
          setCurrentView('reader');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onNavigateToProfile={() => {
          setCurrentView('dashboard');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onNavigateToMap={() => {
          setCurrentView('map');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}

        onNavigateToAdmin={() => {
          setCurrentView('admin');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onNavigateToLeaders={() => {
          setCurrentView('leaders');
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        currentView={currentView}
      />

      {renderContent()}

      <div className={currentView !== 'reader' ? 'hidden' : 'block'}>
        <RightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          chatMessages={chat.chatMessages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isTyping={chat.isTyping}
          onSendMessage={handleSendMessageWrapper}
          onGenerateImage={() => chat.generateImage(selectedVerse)}
          onSpeak={chat.speak}
          onClearChat={async () => {
            await chat.clearChat();
            setSelectedVerse(null);
          }}
          selectedVerse={selectedVerse}
          currentBook={currentBook}
          currentChapter={currentChapter}
          onClearSelection={() => setSelectedVerse(null)}
          notes={notes}
          onSaveNote={saveNote}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          onNavigateToBookmark={(b) => detectAndNavigate(`${b.bookName} ${b.chapterNum}:${b.number}`)}
          onOpenShare={() => setShowShareModal(true)}
          onStartQuiz={quiz.startQuiz}
          quizData={quiz.quizData}
          quizState={quiz.quizState}
          currentQuizIndex={quiz.currentQuizIndex}
          quizScore={quiz.quizScore}
          onAnswerQuiz={quiz.answerQuiz}
          onResetQuiz={quiz.resetQuiz}
          quizSelectedOption={quiz.selectedOption}
          quizShowFeedback={quiz.showFeedback}
          onQuizNextQuestion={quiz.nextQuestion}
          quizUserAnswers={quiz.userAnswers}
          quizDifficulty={quiz.difficulty}
          quizTopic={quiz.topic}
          onSetQuizDifficulty={quiz.setDifficulty}
          onSetQuizTopic={quiz.setTopic}
          onNavigateToMapPage={() => setCurrentView('map')}
        />
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
