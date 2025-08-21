import { useState, useEffect, useRef } from "react";
import { Ellipsis, X } from "lucide-react";
import './AbbreviationComponent.css'

const defaultAbbreviations = [
    { short: "js", full: "JavaScript", caseMatching: false, dynamic: true },
    { short: "css", full: "Cascading Style Sheets", caseMatching: false, dynamic: true },
    { short: "py", full: "Python", caseMatching: false, dynamic: true },
    { short: "html", full: "Hypertext Markup Language", caseMatching: false, dynamic: true },
    { short: "abvr", full: "Abréviation", caseMatching: false, dynamic: false },
];

export default function AbbreviationComponent() {
    const [rows, setRows] = useState([]);
    const [activePopoverId, setActivePopoverId] = useState(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
    const buttonRefs = useRef({});

    // Chargement initial
    useEffect(() => {
        const stored = localStorage.getItem("abbreviations");
        const initialEntries = stored ? JSON.parse(stored) : defaultAbbreviations;
        setRows(initialEntries.map(r => ({
            id: "abbr-" + crypto.randomUUID(),
            short: r.short,
            full: r.full,
            caseMatching: r.caseMatching ?? false,
            dynamic: r.dynamic ?? false
        })));
    }, []);

    // Auto-save
    useEffect(() => {
        if (rows.length === 0) return;
        const timeout = setTimeout(() => {
            const entries = rows
                .map(r => ({
                    short: r.short.trim(),
                    full: r.full.trim(),
                    caseMatching: r.caseMatching,
                    dynamic: r.dynamic
                }))
                .filter(r => r.short && r.full);
            localStorage.setItem("abbreviations", JSON.stringify(entries));
            window.dispatchEvent(new CustomEvent("abbreviation-update", { detail: entries }));
        }, 500);
        return () => clearTimeout(timeout);
    }, [rows]);

    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const addRow = () => {
        setRows(prev => [
            ...prev,
            { id: "abbr-" + crypto.randomUUID(), short: "", full: "", caseMatching: false, dynamic: false }
        ]);
    };

    const removeRow = (id) => {
        setRows(prev => prev.filter(r => r.id !== id));
        if (activePopoverId === id) setActivePopoverId(null);
    };

    const togglePopover = (id) => {
        const buttonEl = buttonRefs.current[id];
        if (!buttonEl) return;

        const rect = buttonEl.getBoundingClientRect();
        setPopoverPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        setActivePopoverId(activePopoverId === id ? null : id);
    };

    // Fermeture clic hors popover
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activePopoverId === null) return;
            const popoverEl = document.getElementById(`popover-${activePopoverId}`);
            const buttonEl = buttonRefs.current[activePopoverId];
            if (!popoverEl || !buttonEl) return;
            if (!popoverEl.contains(e.target) && !buttonEl.contains(e.target)) {
                setActivePopoverId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activePopoverId]);

    if (rows.length === 0) return <div>Loading abbreviations...</div>;

    return (
        <>
            <form id="abbrev-form">
                <ul className="block-list">
                    {rows.map(row => (
                        <li key={row.id}>
                            <fieldset>
                                <input
                                    id={`short-${row.id}`}
                                    type="text"
                                    name="short"
                                    value={row.short}
                                    onChange={e => updateRow(row.id, "short", e.target.value)}
                                    placeholder="Abbr"
                                    maxLength={4}
                                    size={4}
                                />
                                <span className="abbrev-decorator"></span>
                                <input
                                    id={`full-${row.id}`}
                                    type="text"
                                    name="full"
                                    value={row.full}
                                    onChange={e => updateRow(row.id, "full", e.target.value)}
                                    placeholder="Full term"
                                />

                                <button
                                    type="button"
                                    className="abbrev-more"
                                    ref={el => buttonRefs.current[row.id] = el}
                                    onClick={() => togglePopover(row.id)}
                                >
                                    <Ellipsis />
                                </button>

                                {activePopoverId === row.id && (
                                    <div
                                        id={`popover-${row.id}`}
                                        className="abbrev-popup"
                                        style={{
                                            position: "absolute",
                                            top: popoverPos.top,
                                            left: popoverPos.right,
                                            zIndex: 1000
                                        }}
                                    >
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={row.caseMatching}
                                                onChange={e => updateRow(row.id, "caseMatching", e.target.checked)}
                                            />
                                            <h4>Case matching</h4>
                                            <p>Si activé, l’abréviation doit correspondre exactement à la casse de votre saisie </p>
                                        </label>

                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={row.dynamic}
                                                onChange={e => updateRow(row.id, "dynamic", e.target.checked)}
                                            />
                                            <h4>Dynamic</h4>
                                            <p>Si activé, la sortie s’adapte à la casse de votre saisie</p>
                                        </label>

                                        <button type="button" onClick={() => removeRow(row.id)}>
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </fieldset>
                        </li>
                    ))}
                </ul>
            </form>
            <button type="button" onClick={addRow} className="abbrev-add">
                + Ajouter une abréviation
            </button>
        </>
    );
}
