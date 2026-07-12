import React, { useState, useEffect } from 'react';
import { Plus, Book as BookIcon, BarChart, Trophy, X, Clock, Target, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Book, Challenge, BookFormat, DailyGoal } from './types';
import { db, collection, addDoc, getDocs, setDoc, doc, deleteDoc } from './firebase';
import './App.css';

const COLORS = ['#F8C8DC', '#C08081', '#FFD1DC', '#E0A0A0', '#B0C4DE', '#F0E68C'];

function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>({
    target_minutes: 30,
    current_minutes: 0,
    last_updated: new Date().toISOString().split('T')[0]
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    genre: '',
    nationality: '',
    pages: 0,
    format: 'cartaceo',
    cover_url: 'https://via.placeholder.com/120x180?text=Copertina'
  });

  useEffect(() => {
    // 1. Carica Obiettivo Giornaliero
    const savedGoal = localStorage.getItem('tittitracker_daily_goal');
    const today = new Date().toISOString().split('T')[0];
    if (savedGoal) {
      const parsed = JSON.parse(savedGoal);
      if (parsed.last_updated !== today) {
        setDailyGoal({ ...parsed, current_minutes: 0, last_updated: today });
      } else {
        setDailyGoal(parsed);
      }
    }

    // 2. Carica Sfide
    const savedChallenges = localStorage.getItem('tittitracker_challenges');
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      const initialChallenges: Challenge[] = [
        { id: '1', goal: 'Leggi 20 minuti al giorno', target_value: 7, current_value: 0, unit: 'minuti', reward: '🌟 Super Lettore', is_completed: false },
        { id: '2', goal: 'Completa 5 libri', target_value: 5, current_value: 0, unit: 'libri', reward: '📚 Bibliofilo', is_completed: false }
      ];
      setChallenges(initialChallenges);
    }

    // 3. Carica Libri: PRIMA da Firebase (cloud), POI da LocalStorage come fallback
    const loadBooks = async () => {
      if (db) {
        try {
          const querySnapshot = await getDocs(collection(db, 'books'));
          const firebaseBooks: Book[] = [];
          querySnapshot.forEach((docSnap) => {
            firebaseBooks.push({ id: docSnap.id, ...docSnap.data() } as Book);
          });
          if (firebaseBooks.length > 0) {
            setBooks(firebaseBooks);
            localStorage.setItem('tittitracker_books', JSON.stringify(firebaseBooks));
            return; // Firebase ha funzionato, esci
          }
        } catch (err) {
          console.log("Firebase non raggiungibile, provo da locale", err);
        }
      }
      // Fallback: carica da LocalStorage
      const savedBooks = localStorage.getItem('tittitracker_books');
      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      }
    };
    loadBooks();
  }, []);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const bookData = {
      title: newBook.title || '',
      author: newBook.author || '',
      genre: newBook.genre || '',
      nationality: newBook.nationality || '',
      pages: newBook.pages || 0,
      format: newBook.format || 'cartaceo',
      cover_url: newBook.cover_url || 'https://via.placeholder.com/120x180?text=Copertina',
      read_pages: 0,
      is_reading: true,
      start_date: new Date().toISOString().split('T')[0]
    };

    // Chiudi subito il modale
    setIsModalOpen(false);
    setNewBook({
      title: '', author: '', genre: '', nationality: '',
      pages: 0, format: 'cartaceo',
      cover_url: 'https://via.placeholder.com/120x180?text=Copertina'
    });

    // Salva su Firebase (cloud)
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'books'), bookData);
        const newBookObj: Book = { id: docRef.id, ...bookData };
        const updatedBooks = [...books, newBookObj];
        setBooks(updatedBooks);
        localStorage.setItem('tittitracker_books', JSON.stringify(updatedBooks));
        return;
      } catch (err) {
        console.error("Firebase non disponibile, salvo in locale", err);
      }
    }

    // Fallback: salva solo in locale
    const tempId = Math.random().toString(36).substr(2, 9);
    const newBookObj: Book = { id: tempId, ...bookData };
    const updatedBooks = [...books, newBookObj];
    setBooks(updatedBooks);
    localStorage.setItem('tittitracker_books', JSON.stringify(updatedBooks));
  };

  const handleDeleteBook = async (bookId: string) => {
    // Elimina da Firebase se disponibile
    if (db) {
      try {
        await deleteDoc(doc(db, 'books', bookId));
      } catch (err) {
        console.log("Firebase non disponibile per eliminazione", err);
      }
    }

    // Aggiorna stato e localStorage
    const updatedBooks = books.filter(b => b.id !== bookId);
    setBooks(updatedBooks);
    localStorage.setItem('tittitracker_books', JSON.stringify(updatedBooks));
    setSelectedBook(null); // Chiudi il modale dettaglio
  };

  const getGenreData = () => {
    const data: Record<string, number> = {};
    books.forEach(b => {
      if (b.genre) data[b.genre] = (data[b.genre] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  };

  const getFormatData = () => {
    const data: Record<string, number> = {};
    books.forEach(b => {
      if (b.format) data[b.format] = (data[b.format] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  };

  const updateDailyGoal = async (updates: Partial<DailyGoal>) => {
    const newGoal = { ...dailyGoal, ...updates };
    setDailyGoal(newGoal);
    localStorage.setItem('tittitracker_daily_goal', JSON.stringify(newGoal));
    if (db) {
      try {
        await setDoc(doc(db, 'daily_goals', 'today'), newGoal);
      } catch (err) {
        console.log("Errore sincronizzazione goal", err);
      }
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>TittiTracker 🌸</h1>
        <p>Il tuo angolo di lettura cute & minimal</p>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Aggiungi Libro
        </button>
      </header>

      <section>
        <h2>Libreria Virtuale 📚</h2>
        <div className="shelf-container">
          <div className="shelf">
            {books.length === 0 && <p style={{opacity: 0.5}}>La tua libreria è vuota. Aggiungi il tuo primo libro! ✨</p>}
            {books.map(book => (
              <div key={book.id} className="book-card" title={book.title} onClick={() => setSelectedBook(book)}>
                <img src={book.cover_url} alt={book.title} className="book-cover" />
                <div className="book-info-mini">
                  <strong>{book.title}</strong>
                  <div className={`format-tag format-${book.format}`}>{book.format}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <section className="card">
          <h3>Obiettivo Giornaliero 🎯</h3>
          <div className="daily-goal-section">
            <div className="form-group">
              <label><Target size={16} /> Minuti obiettivo oggi</label>
              <input 
                type="number" 
                value={dailyGoal.target_minutes} 
                onChange={e => updateDailyGoal({ target_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> Minuti letti oggi</label>
              <input 
                type="number" 
                value={dailyGoal.current_minutes} 
                onChange={e => updateDailyGoal({ current_minutes: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div className="progress-bar" style={{ height: 20 }}>
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, (dailyGoal.current_minutes / (dailyGoal.target_minutes || 1)) * 100)}%`,
                  backgroundColor: dailyGoal.current_minutes >= dailyGoal.target_minutes ? '#4caf50' : 'var(--pastel-pink)'
                }}
              ></div>
            </div>
            
            <div className={`goal-status ${dailyGoal.current_minutes >= dailyGoal.target_minutes ? 'goal-completed' : 'goal-pending'}`}>
              {dailyGoal.current_minutes >= dailyGoal.target_minutes 
                ? 'Obiettivo Completato! Bravissima! 🌸' 
                : `Mancano ${Math.max(0, dailyGoal.target_minutes - dailyGoal.current_minutes)} minuti al tuo obiettivo! ✨`}
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Statistiche Generi 🥧</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getGenreData()} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {getGenreData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h3>Formati di Lettura 🎧</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={getFormatData()} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {getFormatData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <h3>Sfide & Ricompense 🏆</h3>
          {challenges.map(challenge => (
            <div key={challenge.id} className="challenge-item">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{challenge.goal}</strong>
                  <span>{challenge.current_value}/{challenge.target_value} {challenge.unit}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(challenge.current_value / (challenge.target_value || 1)) * 100}%` }}
                  ></div>
                </div>
                <small>Premio: {challenge.reward}</small>
              </div>
            </div>
          ))}
        </section>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2>Nuovo Libro 📖</h2>
              <X className="btn-close" onClick={() => setIsModalOpen(false)} style={{ cursor: 'pointer' }} />
            </div>
            <form onSubmit={handleAddBook}>
              <div className="form-group">
                <label>Titolo</label>
                <input required type="text" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Autore</label>
                <input required type="text" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Genere</label>
                <input required type="text" value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Nazionalità</label>
                <input type="text" value={newBook.nationality} onChange={e => setNewBook({...newBook, nationality: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Pagine</label>
                <input type="number" value={newBook.pages} onChange={e => setNewBook({...newBook, pages: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Formato</label>
                <select value={newBook.format} onChange={e => setNewBook({...newBook, format: e.target.value as BookFormat})}>
                  <option value="cartaceo">Cartaceo</option>
                  <option value="audiolibro">Audiolibro</option>
                  <option value="kindle">Kindle</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL Copertina</label>
                <input type="text" value={newBook.cover_url} onChange={e => setNewBook({...newBook, cover_url: e.target.value})} />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', marginTop: 10 }}>Salva Libro</button>
            </form>
          </div>
        </div>
      )}

      {/* Modale Dettaglio Libro */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content book-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="book-detail-header">
              <h2>{selectedBook.title}</h2>
              <X className="btn-close" onClick={() => setSelectedBook(null)} style={{ cursor: 'pointer' }} />
            </div>
            
            <div className="book-detail-body">
              <div className="book-detail-cover">
                <img src={selectedBook.cover_url} alt={selectedBook.title} />
              </div>
              
              <div className="book-detail-info">
                <div className="detail-row">
                  <span className="detail-label">Autore</span>
                  <span className="detail-value">{selectedBook.author}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Genere</span>
                  <span className="detail-value">{selectedBook.genre}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Nazionalità</span>
                  <span className="detail-value">{selectedBook.nationality || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pagine</span>
                  <span className="detail-value">{selectedBook.pages}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Formato</span>
                  <span className={`format-tag format-${selectedBook.format}`}>{selectedBook.format}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Iniziato il</span>
                  <span className="detail-value">{selectedBook.start_date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pagine Lette</span>
                  <span className="detail-value">{selectedBook.read_pages} / {selectedBook.pages}</span>
                </div>
              </div>
            </div>

            <div className="book-detail-actions">
              <button className="btn btn-delete" onClick={() => handleDeleteBook(selectedBook.id)}>
                <Trash2 size={18} /> Elimina Libro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;