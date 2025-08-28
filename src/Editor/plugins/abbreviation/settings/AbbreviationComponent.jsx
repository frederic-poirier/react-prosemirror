import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import React from "react";
import { useAbbreviations } from "./useAbbreviations";
import { X, TriangleAlert } from "lucide-react";
import './AbbreviationComponent.css'
import { FormList, Switch, Shortcut } from "../../../../component/settings";

// --- Helpers ---
function validateDuplicates(rows) {
    const shortCounts = {};
    rows.forEach(row => {
        const shortValue = row.short.trim().toLowerCase();
        if (shortValue) {
            shortCounts[shortValue] = (shortCounts[shortValue] || 0) + 1;
        }
    });
    return rows.map(row => {
        const shortValue = row.short.trim().toLowerCase();
        const isDuplicate = shortValue && shortCounts[shortValue] > 1;
        return { ...row, error: isDuplicate ? 'duplicate' : null };
    });
}

export default function AbbreviationComponent() {
    return (
        <>
            <Trigger />
            <AbbreviationForm />
            <DynamicCasing />
        </>
    );
}

// --- Form ---
const AbbreviationForm = React.memo(function AbbreviationForm() {
    const [abbreviations, setAbbreviations] = useAbbreviations();
    const [rows, setRows] = useState(() => validateDuplicates(initialLoad()));
    const [errors, setErrors] = useState([]); // errors séparé
    const inputRefs = useRef(new Map());

    function initialLoad() {
        return abbreviations.map(r => ({
            id: "abbr-" + crypto.randomUUID(),
            short: r.short,
            full: r.full,
            error: null,
        }));
    }

    // Met à jour errors seulement si nécessaire
    useEffect(() => {
        const newErrors = [...new Set(rows.filter(r => r.error).map(r => r.short.toLowerCase()))];
        setErrors(prev => {
            if (
                prev.length === newErrors.length &&
                prev.every((e, i) => e === newErrors[i])
            ) {
                return prev; // rien ne change -> pas de rerender du callout
            }
            return newErrors;
        });
    }, [rows]);

    const saveRow = useCallback((rows) => {
        const entries = rows
            .map(r => ({ short: r.short.trim(), full: r.full.trim() }))
            .filter(r => r.short && r.full);
        setAbbreviations(entries);
    }, [setAbbreviations]);

    const updateRow = useCallback((id, field, value) => {
        setRows(prev => {
            const newRows = prev.map(r => r.id === id ? { ...r, [field]: value } : r);
            const validatedRows = validateDuplicates(newRows);
            saveRow(validatedRows);
            return validatedRows;
        });
    }, [saveRow]);

    const addRow = useCallback((afterId) => {
        const newId = "abbr-" + crypto.randomUUID();
        setRows(prev => {
            const newRow = { id: newId, short: "", full: "", error: null };
            let newRows;
            if (afterId) {
                const index = prev.findIndex(r => r.id === afterId);
                newRows = [...prev.slice(0, index + 1), newRow, ...prev.slice(index + 1)];
            } else {
                newRows = [...prev, newRow];
            }
            const validatedRows = validateDuplicates(newRows);
            saveRow(validatedRows);
            return validatedRows;
        });
        setTimeout(() => focusRow(newId), 0);
        return newId;
    }, [saveRow]);

    const removeRow = useCallback((id, focusPrev = false) => {
        setRows(prev => {
            const index = prev.findIndex(r => r.id === id);
            const newRows = prev.filter(r => r.id !== id);
            const validatedRows = validateDuplicates(newRows);
            saveRow(validatedRows);

            if (focusPrev) {
                const targetRow = validatedRows[index - 1] || validatedRows[index];
                if (targetRow) focusRow(targetRow.id + '-full');
            }
            inputRefs.current.delete(id);
            return validatedRows;
        });
    }, [saveRow]);

    const handleEnter = useCallback((e, row) => {
        e.preventDefault();
        const isShort = e.target.name === "short";
        const fillShort = row.short.trim();
        const fillFull = row.full.trim();

        if (isShort && fillShort) focusRow(row.id + "-full");
        else if (!isShort && fillShort && fillFull) addRow(row.id);
    }, [addRow]);

    const handleBackspace = useCallback((e, row) => {
        const target = e.target;
        const isShort = target.name === "short";
        const selectionEmpty = target.selectionStart === 0 && target.selectionEnd === 0;
        const noText = !target.value;

        if (!isShort && noText && selectionEmpty) {
            e.preventDefault();
            focusRow(row.id);
        } else if (isShort && noText && selectionEmpty && !row.full.trim()) {
            e.preventDefault();
            removeRow(row.id, true);
        }
    }, [removeRow]);

    const registerRef = useCallback((id, el) => {
        if (el) inputRefs.current.set(id, el);
        else inputRefs.current.delete(id);
    }, []);

    function focusRow(id) {
        const el = inputRefs.current.get(id);
        if (el) el.focus();
    }

    if (rows.length === 0) return <div>Loading abbreviations...</div>;
    else return (
        <>
            <AbbreviationCallout errors={errors} />
            <FormList>
                {rows.map((row) => (
                    <AbbreviationRow
                        key={row.id}
                        row={row}
                        updateRow={updateRow}
                        removeRow={removeRow}
                        handleEnter={handleEnter}
                        handleBackspace={handleBackspace}
                        registerRef={registerRef}
                    />
                ))}
            </FormList>
            <button type="button" onClick={() => addRow()} className="abbrev-add">
                + Ajouter une abréviation
            </button>
        </>
    );
});

// --- Callout ---
const AbbreviationCallout = React.memo(function AbbreviationCallout({ errors }) {
    return (
        <div className={`callout warning ${errors.length > 0 ? 'visible' : ''}`}>
            <TriangleAlert />
            <h3>Attention</h3>
            <p>
                {errors.length === 1 ? "L'abréviation " : "Les abréviations "}
                {errors.map((error, index) => (
                    <React.Fragment key={error}>
                        <span className="abbrev-duplicate">{error}</span>
                        {index < errors.length - 2 ? ", " : index === errors.length - 2 ? " et " : ""}
                    </React.Fragment>
                ))}
                {errors.length === 1
                    ? " est utilisée plusieurs fois, la dernière occurrence écrase les précédentes."
                    : " sont utilisées plusieurs fois, la dernière occurrence de chacune écrase les précédentes."
                }
                Veuillez modifier l’une des occurrences pour éviter les doublons.
            </p>
        </div>
    );
}, (prev, next) => {
    if (prev.errors.length !== next.errors.length) return false;
    return prev.errors.every((e, i) => e === next.errors[i]);
});

// --- Row ---
const AbbreviationRow = React.memo(function AbbreviationRow({
    row,
    updateRow,
    removeRow,
    handleEnter,
    handleBackspace,
    registerRef
}) {
    const DeleteIcon = useMemo(() => <X />, []);
    const DangerIcon = useMemo(() => <TriangleAlert />, []);

    return (
        <fieldset>
            <input
                ref={el => registerRef(row.id, el)}
                id={row.id}
                type="text"
                name="short"
                value={row.short}
                onChange={e => updateRow(row.id, "short", e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") handleEnter(e, row);
                    if (e.key === "Backspace") handleBackspace(e, row);
                }}
                placeholder="Abbr"
                maxLength={4}
                size={4}
                autoComplete="off"
                className={row.error === 'duplicate' ? 'error' : ''}
            />
            <span className="abbrev-decorator"></span>
            <input
                ref={el => registerRef(row.id + "-full", el)}
                id={row.id + "-full"}
                type="text"
                name="full"
                value={row.full}
                onChange={e => updateRow(row.id, "full", e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") handleEnter(e, row);
                    if (e.key === "Backspace") handleBackspace(e, row);
                }}
                placeholder="Full term"
                autoComplete="off"
            />
            <button
                type="button"
                className="abbrev-del"
                disabled={row.error}
                onClick={() => removeRow(row.id)}
            >
                {row.error ? DangerIcon : DeleteIcon}
            </button>
        </fieldset>
    );
}, (prevProps, nextProps) => (
    prevProps.row.short === nextProps.row.short &&
    prevProps.row.full === nextProps.row.full &&
    prevProps.row.error === nextProps.row.error
));

// --- Dynamic casing ---
const DynamicCasing = React.memo(function () {
    return (
        <>
            <FormList defaultValues={{ dynamicCasing: false }}>
                <Switch label='Dynamic casing' settingKey='dynamicCasing'/>
            </FormList>
            <p className="abbrev-description">
                Lorsque activé, la sortie adapte sa casse à celle de l’abréviation saisie.
                et lorsque désactivé la sortie utilise toujours la casse originale de l’abréviation.
            </p>
        </>
    );
});

const Trigger = React.memo(function () {
    return (
        <FormList defaultValues={{ preventTriggerModification: false, shortcutTrigger: [' '] }}>
            <Switch label='Prevent trigger' settingKey='preventTriggerModification' />
            <Shortcut label='Define shorcut' settingKey='shortcutTrigger' maxLength={1} />
        </FormList>
    )
})
