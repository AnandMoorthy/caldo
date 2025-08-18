// Build searchable index from tasksMap
export function buildSearchIndex(tasksMap, snippets = []) {
  const index = [];
  
  Object.entries(tasksMap).forEach(([dateKey, dayTasks]) => {
    if (!Array.isArray(dayTasks)) return;
    
    // Index all tasks
    dayTasks.forEach(task => {
      if (task.id === 'day_note') return; // Skip day notes here, handle separately
      
      index.push({
        id: task.id,
        type: 'task',
        title: task.title,
        content: task.notes || '',
        dateKey,
        priority: task.priority,
        completed: !!task.done,
        due: task.due,
        searchableText: `${task.title} ${task.notes || ''} ${task.subtasks?.map(st => st.title).join(' ') || ''}`.toLowerCase()
      });
    });
    
    // Index day notes
    const dayNote = dayTasks.find(item => item.id === 'day_note');
    if (dayNote?.dayNote) {
      index.push({
        id: `${dateKey}_note`,
        type: 'note',
        content: dayNote.dayNote,
        dateKey,
        searchableText: dayNote.dayNote.toLowerCase()
      });
    }
  });
  
  // Index global snippets
  (Array.isArray(snippets) ? snippets : []).forEach(snippet => {
    if (!snippet) return;
    index.push({
      id: snippet.id,
      type: 'snippet',
      title: snippet.title || 'Snippet',
      content: snippet.content || '',
      updatedAt: snippet.updatedAt || null,
      searchableText: `${snippet.title || ''} ${snippet.content || ''}`.toLowerCase(),
    });
  });

  return index;
}

// Search tasks and notes based on query
export function searchTasks(query, searchIndex) {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  const normalizeDate = (value) => {
    try {
      if (!value) return new Date(0);
      if (typeof value?.toDate === 'function') return value.toDate();
      return new Date(value);
    } catch { return new Date(0); }
  };

  return searchIndex
    .filter(item => 
      item.searchableText.includes(searchTerm) ||
      item.title?.toLowerCase().includes(searchTerm)
    )
    .sort((a, b) => {
      // Prioritize exact title matches
      const aTitleMatch = a.title?.toLowerCase().includes(searchTerm);
      const bTitleMatch = b.title?.toLowerCase().includes(searchTerm);
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      // Then by recency: snippets by updatedAt, others by dateKey
      const aTime = a.updatedAt ? normalizeDate(a.updatedAt) : (a.dateKey ? normalizeDate(a.dateKey) : new Date(0));
      const bTime = b.updatedAt ? normalizeDate(b.updatedAt) : (b.dateKey ? normalizeDate(b.dateKey) : new Date(0));
      return bTime - aTime;
    })
    .slice(0, 20); // Limit results for performance
}

// Highlight matching text in search results
export function highlightText(text, query) {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
}
