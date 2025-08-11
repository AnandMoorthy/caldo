import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, StickyNote, CheckCircle, Circle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { highlightText } from "../utils/search.js";

export default function SearchModal({ 
  isOpen, 
  onClose, 
  searchResults, 
  onNavigateToItem,
  query,
  onQueryChange 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            onNavigateToItem(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onNavigateToItem, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && searchResults.length > 0 && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        // Only scroll if the element is not fully visible
        const container = resultsRef.current;
        const elementRect = selectedElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }
      }
    }
  }, [selectedIndex, searchResults.length]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="absolute top-24 left-0 right-0 mx-auto w-[32rem] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks and notes..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-base bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
          />
        </div>

        {/* Search Results */}
        {query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto"
            ref={resultsRef}
          >
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <Search className="mx-auto mb-2 text-slate-300" size={24} />
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <SearchResult
                    key={result.id}
                    result={result}
                    isSelected={index === selectedIndex}
                    query={query}
                    onClick={() => onNavigateToItem(result)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="mt-3 text-center text-xs text-slate-700 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs text-slate-800 dark:text-slate-300 font-medium">↑↓</kbd> Navigate
          </span>
          <span className="mx-2">•</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs text-slate-800 dark:text-slate-300 font-medium">Enter</kbd> Select
          </span>
          <span className="mx-2">•</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs text-slate-800 dark:text-slate-300 font-medium">Esc</kbd> Close
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SearchResult({ result, isSelected, query, onClick }) {
  const getIcon = () => {
    if (result.type === 'note') return <StickyNote size={16} />;
    if (result.completed) return <CheckCircle size={16} />;
    return <Circle size={16} />;
  };

  const getPriorityColor = () => {
    if (result.type === 'note') return 'text-blue-500';
    if (result.priority === 'high') return 'text-red-500';
    if (result.priority === 'low') return 'text-green-500';
    return 'text-amber-500';
  };

  const formatDate = (dateKey) => {
    try {
      return format(parseISO(dateKey), 'MMM d, yyyy');
    } catch {
      return dateKey;
    }
  };

  return (
    <div
      className={`p-4 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${getPriorityColor()}`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {result.type === 'note' ? 'Day Note' : result.title}
            </span>
            {result.type === 'task' && result.priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                result.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                result.priority === 'low' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {result.priority.charAt(0).toUpperCase() + result.priority.slice(1)}
              </span>
            )}
          </div>
          
          {result.content && (
            <div 
              className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2"
              dangerouslySetInnerHTML={{ 
                __html: highlightText(result.content, query) 
              }}
            />
          )}
          
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar size={12} />
            <span>{formatDate(result.dateKey)}</span>
            {result.type === 'task' && result.due && (
              <>
                <Clock size={12} />
                <span>Due {format(parseISO(result.due), 'MMM d')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
