import React, { useState } from 'react';
import { Search, Hash } from 'lucide-react';
import { Book } from '../../types';
import { BIBLE_VERSIONS } from '../../constants';

interface SidebarBookListProps {
    bibleId: string;
    setBibleId: (id: string) => void;
    apiBooks: Book[];
    currentBook: Book | null;
    onSelectBook: (book: Book) => void;
    theme: string;
    textClasses: string;
    inputClasses: string;
    selectClasses: string;
}

export const SidebarBookList: React.FC<SidebarBookListProps> = ({
    bibleId, setBibleId, apiBooks, currentBook, onSelectBook, theme, textClasses, inputClasses, selectClasses
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredBooks = apiBooks.filter(b =>
        b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );

    return (
        <>
            <div className="px-4 mb-4 shrink-0 space-y-3 mt-2">
                <select value={bibleId} onChange={(e) => setBibleId(e.target.value)} className={`w-full text-[10px] font-bold uppercase p-3 rounded-xl outline-none cursor-pointer border ${selectClasses}`}>
                    {BIBLE_VERSIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <div className="relative group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 transition-all ${textClasses}`} />
                    <input type="text" placeholder="Buscar libro..." className={`w-full border p-3 pl-10 rounded-xl text-xs outline-none focus:border-orange-500 transition-all ${inputClasses}`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </div>

            <nav className={`flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar pb-6 overflow-x-hidden`}>
                {filteredBooks.map(book => {
                    const isSelected = currentBook?.id === book.id;
                    return (
                        <button
                            key={book.id}
                            onClick={() => onSelectBook(book)}
                            className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center gap-3 
                    ${isSelected ? 'bg-orange-600 text-white font-bold shadow-lg shadow-orange-600/20' : `font-medium hover:opacity-100 opacity-90 ${theme === 'dark' ? 'text-neutral-300 hover:bg-blue-800/30' : (theme === 'sepia' ? 'text-[#5b4636] hover:bg-[#eaddcf]' : 'text-neutral-600 hover:bg-neutral-100')}`}`}
                        >
                            <Hash size={14} className={isSelected ? "opacity-50" : "opacity-30"} />
                            <span className="truncate">{book.name}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
};
