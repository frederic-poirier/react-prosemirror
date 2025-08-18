import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Drawer } from 'vaul';
import './AbbreviationComponent.css';

const defaultAbbreviations = [
    ['js', 'JavaScript'],
    ['css', 'Cascading Style Sheets'],
    ['py', 'Python'],
    ['html', 'Hypertext Markup Language'],
    ['abvr', 'Abréviation'],
];

export default function AbbreviationComponent() {
    const [rows, setRows] = useState([]);
    const rowRefs = useRef({});
    const newRowIdRef = useRef(null);

    // Chargement initial
    useEffect(() => {
        const stored = localStorage.getItem('abbreviations');
        const initialEntries = stored
            ? JSON.parse(stored)
            : defaultAbbreviations;

        const initialRows = initialEntries.map(([short, full]) => ({
            id: Date.now() + Math.random(),
            short,
            full,
        }));

        setRows(initialRows);

        // Dispatch initial
        const map = new Map(initialRows.map(r => [r.short, r.full]));
        Promise.resolve().then(() =>
            window.dispatchEvent(
                new CustomEvent('abbreviation-update', { detail: map })
            )
        );
    }, []);

    // Focus sur la nouvelle ligne
    useLayoutEffect(() => {
        if (newRowIdRef.current && rowRefs.current[newRowIdRef.current]?.short) {
            rowRefs.current[newRowIdRef.current].short.focus();
            newRowIdRef.current = null;
        }
    }, [rows]);

    const addRow = () => {
        const newId = Date.now() + Math.random();
        setRows(prev => [...prev, { id: newId, short: '', full: '' }]);
        newRowIdRef.current = newId;
    };

    const removeRow = id => {
        setRows(prev => prev.filter(r => r.id !== id));
        delete rowRefs.current[id];
    };


    const handleEnter = (e, field, id) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const index = rows.findIndex(r => r.id === id);
        if (index === -1) return;

        if (field === 'short') {
            rowRefs.current[id]?.full?.focus();
        } else if (field === 'full') {
            const row = rows[index];
            if ((row.short || '').trim() || (row.full || '').trim()) addRow();
        }
    };

    const saveChanges = form => {
        const data = new FormData(form);
        const shorts = data.getAll('short[]').map(s => s.trim().toLowerCase());
        const fulls = data.getAll('full[]').map(f => f.trim());
        const entries = shorts
            .map((s, i) => [s, fulls[i]])
            .filter(([s, f]) => s && f);

        const newRows = entries.map(([short, full]) => ({ id: Date.now() + Math.random(), short, full }));
        setRows(newRows)
        localStorage.setItem('abbreviations', JSON.stringify(entries));
        console.log(entries, localStorage.getItem('abbreviations'))
        const map = new Map(entries);
        window.dispatchEvent(new CustomEvent('abbreviation-update', { detail: map }));
    };

    if (rows.length === 0) return <div>Loading abbreviations...</div>;

    return (
        <Drawer.Root  onAnimationEnd={open => { if (!open) saveChanges(document.querySelector('form')); }}>
            <Drawer.Trigger className="drawer-trigger">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3">
                    <path d="M433-80q-27 0-46.5-18T363-142l-9-66q-13-5-24.5-12T307-235l-62 26q-25 11-50 2t-39-32l-47-82q-14-23-8-49t27-43l53-40q-1-7-1-13.5v-27q0-6.5 1-13.5l-53-40q-21-17-27-43t8-49l47-82q14-23 39-32t50 2l62 26q11-8 23-15t24-12l9-66q4-26 23.5-44t46.5-18h94q27 0 46.5 18t23.5 44l9 66q13 5 24.5 12t22.5 15l62-26q25-11 50-2t39 32l47 82q14 23 8 49t-27 43l-53 40q1 7 1 13.5v27q0 6.5-2 13.5l53 40q21 17 27 43t-8 49l-48 82q-14 23-39 32t-50-2l-60-26q-11 8-23 15t-24 12l-9 66q-4 26-23.5 44T527-80h-94Zm7-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
                </svg>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="drawer-overlay" />
                <Drawer.Content className="drawer-content">
                    <Drawer.Title className="drawer-title">Gérer les abréviations</Drawer.Title>
                    <Drawer.Description className='drawer-description'>
                        Crée tes abréviations personnalisées pour une prise de note rapide et adaptée.
                    </Drawer.Description>

                    <form id='abbrev-form'>
                        {rows.map(row => (
                            <fieldset key={row.id} className="abbrev-fieldset">
                                <input
                                    type="text"
                                    name="short[]"
                                    defaultValue={row.short}
                                    placeholder="Abbr"
                                    maxLength="4"
                                    size='4'
                                    ref={el => {
                                        if (el) {
                                            rowRefs.current[row.id] = rowRefs.current[row.id] || {};
                                            rowRefs.current[row.id].short = el;
                                        } else {
                                            // l’élément est démonté, supprimer la référence
                                            if (rowRefs.current[row.id]) {
                                                delete rowRefs.current[row.id].short;
                                            }
                                        }
                                    }}

                                    onKeyDown={e => handleEnter(e, 'short', row.id)}
                                />
                                <span className='abbrev-decorator'></span>
                                <input
                                    type="text"
                                    name="full[]"
                                    defaultValue={row.full}
                                    placeholder="Full term"
                                    ref={el => {
                                        if (el) {
                                            rowRefs.current[row.id] = rowRefs.current[row.id] || {};
                                            rowRefs.current[row.id].full = el;
                                        } else {
                                            if (rowRefs.current[row.id]) {
                                                delete rowRefs.current[row.id].full;
                                            }
                                        }
                                    }}

                                    onKeyDown={e => handleEnter(e, 'full', row.id)}
                                />
                                <button type="button" className='abbrev-delete' onClick={() => removeRow(row.id)}>✕</button>
                            </fieldset>
                        ))}
                    </form>

                    <button type="button" onClick={addRow} className="abbrev-add">+ Ajouter une abréviation</button>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
