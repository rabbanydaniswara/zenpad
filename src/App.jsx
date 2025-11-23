// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "./firebaseconfig";
import {
  signInAnonymously,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Untuk debounce (menyimpan timer)
  const debounceTimer = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        const cred = await signInAnonymously(auth);
        setUser(cred.user);
      } else {
        setUser(currentUser);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const notesRef = collection(db, "users", user.uid, "notes");
    const q = query(notesRef, orderBy("updatedAt", "desc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNotes(data);
      setLoadingNotes(false);

      if (!selectedNoteId && data.length > 0) {
        setSelectedNoteId(data[0].id);
      }
    });

    return () => unsub();
  }, [user]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const handleNewNote = async () => {
    if (!user) return;

    const notesRef = collection(db, "users", user.uid, "notes");
    const newNote = {
      title: "Catatan Baru",
      content: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(notesRef, newNote);
    setSelectedNoteId(docRef.id);
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "notes", noteId));

    if (selectedNoteId === noteId) {
      const remaining = notes.filter((n) => n.id !== noteId);
      setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // -----------------------------------
  // DEBOUNCE AUTOSAVE
  // -----------------------------------
  const debouncedSave = (noteId, field, value) => {
    if (!user) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const noteRef = doc(db, "users", user.uid, "notes", noteId);
      await updateDoc(noteRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
    }, 600); // Simpan ketika berhenti mengetik 600ms
  };

  // AUTOSAVE Judul
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, title: newTitle } : n
      )
    );

    debouncedSave(selectedNoteId, "title", newTitle);
  };

  // AUTOSAVE Isi
  const handleContentChange = (e) => {
    const newContent = e.target.value;

    setNotes((prev) =>
      prev.map((n) =>
        n.id === selectedNoteId ? { ...n, content: newContent } : n
      )
    );

    debouncedSave(selectedNoteId, "content", newContent);
  };

  return (
    <div className="app-root">
      <div className="app-container">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1>Cloud Notes</h1>
            <button className="btn-primary" onClick={handleNewNote}>
              + New Note
            </button>
          </div>

          {loadingNotes ? (
            <div className="empty-state">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="empty-state">
              Belum ada catatan.
              <br />Klik <strong>New Note</strong> untuk mulai.
            </div>
          ) : (
            <ul className="note-list">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className={
                    "note-list-item" +
                    (note.id === selectedNoteId ? " active" : "")
                  }
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <div className="note-title">
                    {note.title?.trim() || "Tanpa Judul"}
                  </div>
                  <button
                    className="btn-delete"
                    onClick={(e) => handleDeleteNote(note.id, e)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* EDITOR */}
        <main className="editor">
          {!selectedNote ? (
            <div className="editor-empty">
              Pilih atau buat catatan baru.
            </div>
          ) : (
            <div className="editor-inner">
              <input
                className="editor-title"
                value={selectedNote.title || ""}
                onChange={handleTitleChange}
                placeholder="Judul catatan..."
              />
              <textarea
                className="editor-textarea"
                value={selectedNote.content || ""}
                onChange={handleContentChange}
                placeholder="Tulis catatanmu di sini..."
              />
              <div className="editor-footer">
                <span>Autosave (debounce) — tersimpan di Firestore</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
