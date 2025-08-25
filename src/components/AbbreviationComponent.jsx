import { useState, useMemo, useCallback } from "react";
import React from "react";
import { useAbbreviations } from "./useAbbreviations";
import { X } from "lucide-react";
import './AbbreviationComponent.css'

export default function AbbreviationComponent() {
    const [abbreviations, setAbbreviations] = useAbbreviations();
    const [rows, setRows] = useState(() => initialLoad());

    // Chargement initial
    function initialLoad() {
        return (abbreviations.map(r => ({
            id: "abbr-" + crypto.randomUUID(),
            short: r.short,
            full: r.full,
        })));
    }

    const saveRow = useCallback((rows) => {
        const entries = rows
            .map(r => ({
                short: r.short.trim(),
                full: r.full.trim(),
            }))
            .filter(r => r.short && r.full);
        setAbbreviations(entries);
    }, [setAbbreviations]);

    const updateRow = useCallback((id, field, value) => {
        setRows(prev => {
            const newRows = prev.map(r => (r.id === id ? { ...r, [field]: value } : r));
            saveRow(newRows);
            return newRows;
        });
    }, [saveRow]);

    const addRow = useCallback((afterId) => {
        let newId = "abbr-" + crypto.randomUUID();
        setRows(prev => {
            let newRow = { id: newId, short: "", full: "" };
            let newRows;
            if (afterId) {
                const index = prev.findIndex(r => r.id === afterId);
                newRows = [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
            } else {
                newRows = [...prev, newRow];
            }
            saveRow(newRows);
            return newRows;
        });
        return newId;
    }, [saveRow]);


    const removeRow = useCallback((id, focusNext = false) => {
        setRows(prev => {
            const index = prev.findIndex(r => r.id === id);
            const newRows = prev.filter(r => r.id !== id);
            saveRow(newRows);

            if (focusNext) {
                setTimeout(() => {
                    const inputs = document.querySelectorAll(`#abbrev-form input[name="full"]`);
                    const toFocus = inputs[index - 1] || inputs[index];
                    toFocus?.focus();
                }, 0);
            }

            return newRows;
        });
    }, [saveRow]);



    // Gestion du clavier
    const handleEnter = useCallback((e, row) => {
        e.preventDefault();
        const target = e.target;
        const isShort = target.name === "short";

        if (isShort && row.short.trim()) {
            // Aller au full
            const next = document.getElementById(`full-${row.id}`);
            next?.focus();
        } else if (!isShort && row.short.trim() && row.full.trim()) {
            const newId = addRow(row.id);
            setTimeout(() => {
                document.getElementById(`short-${newId}`)?.focus();
            }, 0);
        }
    }, [addRow])

    const handleBackspace = useCallback((e, row) => {
        const target = e.target;
        const isShort = target.name === "short";
        const selectionEmpty = target.selectionStart === 0 && target.selectionEnd === 0;
        const noText = !target.value;

        if (!isShort && noText && selectionEmpty) {
            e.preventDefault();
            const prev = document.getElementById(`short-${row.id}`);
            prev?.focus();
        } else if (isShort && noText && selectionEmpty && !row.full.trim()) {
            // Supprimer la row courante et focus sur la précédente
            e.preventDefault();
            removeRow(row.id, true);
        }
    }, [removeRow])

    if (rows.length === 0) return <div>Loading abbreviations...</div>;

    return (
        <>
            <form id="abbrev-form">
                <ul className="block-list">
                    {rows.map((row, i) => (
                        <AbbreviationRow
                            key={row.id}
                            row={row}
                            rowIndex={i}
                            updateRow={updateRow}
                            removeRow={removeRow}
                            addRow={addRow}
                            handleEnter={handleEnter}
                            handleBackspace={handleBackspace}
                        />
                    ))}
                </ul>
            </form>
            <button type="button" onClick={() => addRow()} className="abbrev-add">
                + Ajouter une abréviation
            </button>
        </>
    );
}

const AbbreviationRow = React.memo(function AbbreviationRow({
    row,
    rowIndex,
    updateRow,
    removeRow,
    handleEnter,
    handleBackspace
}) {

    const DeleteIcon = useMemo(() => <X />, []);

    return (
        <li>
            <fieldset>
                <input
                    id={`short-${row.id}`}
                    type="text"
                    name="short"
                    value={row.short}
                    onChange={e => updateRow(row.id, "short", e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") handleEnter(e, row);
                        if (e.key === "Backspace") handleBackspace(e, row, rowIndex);
                    }}
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
                    onKeyDown={e => {
                        if (e.key === "Enter") handleEnter(e, row);
                        if (e.key === "Backspace") handleBackspace(e, row, rowIndex);
                    }}
                    placeholder="Full term"
                />
                <button type="button" className="abbrev-del" onClick={() => removeRow(row.id)}>
                    {DeleteIcon}
                </button>
            </fieldset>
        </li>
    );
});
