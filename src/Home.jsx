import { Link } from "react-router-dom";
import { Settings, Plus, FileText } from "lucide-react";
import './Home.css'

export default function Home() {
    // Exemple bidon de notes existantes
    const notes = [
        { id: "1", title: "Note sur ProseMirror", time: '20h' },
        { id: "2", title: "Note pour l'examen d'histoire", time: '1 month' },
    ];

    return (
        <>
            <header className="home-header">
                <FileText />
                <Link to="/settings"> <Settings /></Link>
            </header>
            <main className="home">
                <h1>Notes récentes</h1>
                <ul className="home-notes">
                    {notes.map((note) => (
                        <li key={note.id}>
                            <Link to={`/notes/${note.id}`}>
                            <span>Last update: {note.time}</span>
                            {note.title}
                            </Link>
                        </li>
                    ))}
                    <li className="home-notes-add">
                        <Link to="/notes/new">
                            <Plus />
                        </Link>
                    </li>
                </ul>
            </main>
        </>
    );
}
