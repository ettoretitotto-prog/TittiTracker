import React, { useState, useEffect } from 'react';
import { Plus, Book as BookIcon, BarChart, Trophy, X, Clock, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Book, Challenge, BookFormat, DailyGoal } from './types';
import { db, collection, addDoc, getDocs, setDoc, doc } from './firebase';
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
    // 1. Carica/Inizializza Obiettivo Giornaliero
    const savedGoal = localStorage.getItem('tittitracker_daily_goal');
    let currentGoal: DailyGoal = {
      target_minutes: 30,
      current_minutes: 0,
      last_updated: new Date().toISOString().split('T')[0]
    };
    if (savedGoal) {
      const parsed = JSON.parse(savedGoal);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.last_updated !== today) {
        currentGoal = { ...parsed, current_minutes: 0, last_updated: today };
      } else {
        currentGoal = parsed;
      }
    }
    setDailyGoal(currentGoal);

    // 2. Carica Libri da Firebase (o LocalStorage se offline/errore)
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'books'));
        const firebaseBooks: Book[] = [];
        querySnapshot.forEach((docSnap) => {
          firebaseBooks.push({ id: docSnap.id, ...docSnap.data() } as Book);
        });

        if (firebaseBooks.length > 0) {
          setBooks(firebaseBooks);
          localStorage.setItem('tittitracker_books', JSON.stringify(firebaseBooks));
        } else {
          loadLocalBooks();
        }
      } catch (err) {
        console.log("Firebase offline, carico da localStorage", err);
        loadLocalBooks();
      }
    };

    const loadLocalBooks = () => {
      const savedBooks = localStorage.getItem('tittitracker_books');
      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      } else {
        const defaultBooks: Book[] = [
          { id: '1', title: 'Il Piccolo Principe', author: 'Antoine de Saint-Exupéry', genre: 'Classico', nationality: 'Francese', cover_url: 'https://m.media-amazon.com/images/I/71Yf9S0u6HL._AC_UF1000,1000_QL80_.jpg', pages: 96, read_pages: 96, is_reading: false, start_date: '2023-01-01', format: 'cartaceo' },
          { id: '2', title: 'Harry Potter e la Pietra Filosofale', author: 'J.K. Rowling', genre: 'Fantasy', nationality: 'Inglese', cover_url: 'https://m.media-amazon.com/images/I/81YOuOG6nBL._AC_UF1000,1000_QL80_.jpg', pages: 300, read_pages: 150, is_reading: true, start_date: '2023-10-15', format: 'kindle' }
        ];
        setBooks(defaultBooks);
        localStorage.setItem('tittitracker_books', JSON.stringify(defaultBooks));
      }
    };

    // 3. Carica Sfide
    const savedChallenges = localStorage.getItem('tittitracker_challenges');
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      const initialChallenges: Challenge[] = [
        { id: '1', goal: 'Leggi 20 minuti al giorno', target_value: 7, current_value: 0, unit: 'minuti', reward: '🌟 Super Lettore', is_completed: false },
        { id: '2', goal: 'Completa 5 libri', target_value: 5, current_value: 0, unit: 'libri', reward: '📚 Bibliofilo', is_completed: false }
      ];
      setChallenges(initialChallenges);
      localStorage.setItem('tittitracker_challenges', JSON.stringify(initialChallenges));
    }

    fetchBooks();
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

    try {
      // Salva su Firebase Firestore
      const docRef = await addDoc(collection(db, 'books'), bookData);
      const newBookObj: Book = { id: docRef.id, ...bookData };
      const updatedBooks = [...books, newBookObj];
      setBooks(updatedBooks);
      localStorage.setItem('tittitracker_books', JSON.stringify(updatedBooks));
    } catch (err) {
      console.error("Errore salvataggio Firebase, salvo in locale", err);
      const newBookObj: Book = { id: Math.random().toString(36).substr(2, 9), ...bookData };
      const updatedBooks = [...books, newBookObj];
      setBooks(updatedBooks);
      localStorage.setItem('tittitracker_books', JSON.stringify(updatedBooks));
    }

    setIsModalOpen(false);
    setNewBook({
      title: '',
      author: '',
      genre: '',
      nationality: '',
      pages: 0,
      format: 'cartaceo',
      cover_url: 'https://via.placeholder.com/120x180?text=Copertina'
    });
  };

  const getGenreData = () => {
    const data: Record<string, number> = {};
    books.forEach(b => {
      data[b.genre] = (data[b.genre] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  };

  const getFormatData = () => {
    const data: Record<string, number> = {};
    books.forEach(b => {
      data[b.format] = (data[b.format] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  };

  const updateDailyGoal = async (updates: Partial<DailyGoal>) => {
    const newGoal = { ...dailyGoal, ...updates };
    setDailyGoal(newGoal);
    localStorage.setItem('tittitracker_daily_goal', JSON.stringify(newGoal));

    // Salva anche l'obiettivo giornaliero su Firebase
    try {
      await setDoc(doc(db, 'daily_goals', 'today'), newGoal);
    } catch (err) {
      console.log("Impossibile salvare l'obiettivo su Firebase, salvato in locale", err);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>TittiTracker 🌸</h1>
        <p>Il tuo angolo di lettura cute & minimal (Online Cloud Sync ☁️)</p>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} /> Aggiungi Libro
        </button>
      </header>

      <section>
        <h2>Libreria Virtuale 📚</h2>
        <div className="shelf-container">
          <div className="shelf">
            {books.map(book => (
              <div key={book.id} className="book-card" title={book.title}>
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
                  width: `${Math.min(100, (dailyGoal.current_minutes / dailyGoal.target_minutes) * 100)}%`,
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
                    style={{ width: `${(challenge.current_value / challenge.target_value) * 100}%` }}
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
    </div>
  );
}

export default App;
