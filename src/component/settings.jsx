import { useRef, useMemo, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "../utils/useSettings";
import './settings.css'

export function NavigationList({ children }) {
    return (
        <ul className="block-list">
            {children}
        </ul>
    )
}

export function NavigationListItem({ link }) {
    return (
        <li>
            <Link to={link}>
                {link}
                <ChevronRight />
            </Link>
        </li>
    )
}

export function FormList({ children }) {
    return (
        <form className="block-list">
            {children}
        </form>
    );
}

export function Switch({ label, path }) {
    const [setSetting, getSetting] = useSettings();
    const value = getSetting(path)
    const id = useMemo(() => crypto.randomUUID(), [])

    return (
        <label htmlFor={id}>
            {label}
            <span className="switch">
                <input
                    tabIndex={0}
                    type="checkbox"
                    id={id}
                    onChange={() => setSetting(path, !value)}
                    checked={value}
                />
                <span className="slider"></span>
            </span>
        </label>
    )
}

export function Table({ headers, path }) {
    const [setSetting, getSetting] = useSettings();
    const rows = getSetting(path) || [];

    const fieldsetRefs = useRef([]);
    const pendingFocusRef = useRef(null);

    const handleChange = (rowIndex, key, value) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = { ...updatedRows[rowIndex], [key]: value };
        setSetting(path, updatedRows);
    };

    const addRow = (afterIndex = rows.length - 1) => {
        const keys = Object.keys(rows[0] || { col1: "" });
        const newRow = Object.fromEntries(keys.map(k => [k, ""]));
        const updatedRows = [
            ...rows.slice(0, afterIndex + 1),
            newRow,
            ...rows.slice(afterIndex + 1),
        ];
        setSetting(path, updatedRows);

        // Planifier le focus pour après le re-render
        pendingFocusRef.current = {
            type: 'add',
            rowIndex: afterIndex + 1,
            inputIndex: 0
        };
    };

    const removeRow = (rowIndex) => {
        if (rows.length <= 1) return;
        const updatedRows = rows.filter((_, i) => i !== rowIndex);
        setSetting(path, updatedRows);

        // Planifier le focus pour après le re-render
        pendingFocusRef.current = {
            type: 'remove',
            rowIndex: Math.max(rowIndex - 1, 0),
            inputIndex: -1 // dernière input
        };
    };

    // Gérer le focus après les changements de structure
    useEffect(() => {
        if (!pendingFocusRef.current) return;

        const { _, rowIndex, inputIndex } = pendingFocusRef.current;
        const fieldset = fieldsetRefs.current[rowIndex];

        if (fieldset) {
            const inputs = fieldset.querySelectorAll("input");
            if (inputs.length > 0) {
                const targetInput = inputIndex === -1
                    ? inputs[inputs.length - 1]
                    : inputs[inputIndex];
                targetInput?.focus();
            }
        }

        pendingFocusRef.current = null;
    }, [rows.length]); // Se déclenche quand le nombre de rows change

    const handleKeyDown = (e, rowIndex, inputIndex) => {
        const fieldset = fieldsetRefs.current[rowIndex];
        const inputs = Array.from(fieldset.querySelectorAll("input"));

        if (e.key === "Enter") {
            e.preventDefault();
            const currentValue = inputs[inputIndex].value.trim();
            if (!currentValue) return;

            if (inputIndex < inputs.length - 1) {
                inputs[inputIndex + 1].focus();
            } else {
                const allFilled = inputs.every(i => i.value.trim() !== "");
                if (allFilled) addRow(rowIndex);
            }
        }

        if (e.key === "Backspace") {
            const currentValue = inputs[inputIndex].value;
            // Correction du bug : vérifier si le champ est vide
            if (currentValue !== "") return;

            const allEmpty = inputs.every(i => i.value === "");
            if (allEmpty) {
                removeRow(rowIndex);
            } else if (inputIndex !== 0) {
                inputs[inputIndex - 1].focus();
            }
        }
    };

    return (
        <form className="table-settings">
            <header>
                {headers.map((h) => <h4 key={h}>{h}</h4>)}
            </header>
            {rows.map((row, rowIndex) => {
                const keys = Object.keys(row);
                return (
                    <fieldset
                        key={rowIndex}
                        ref={el => (fieldsetRefs.current[rowIndex] = el)}
                    >
                        {keys.map((key, inputIndex) => (
                            <label key={key + "-" + rowIndex} className={key}>
                                {key}
                                <input
                                    id={key + "-" + rowIndex}
                                    placeholder={headers[inputIndex]}
                                    type="text"
                                    value={row[key]}
                                    onChange={e => handleChange(rowIndex, key, e.target.value)}
                                    onKeyDown={e => handleKeyDown(e, rowIndex, inputIndex)}
                                />
                            </label>
                        ))}
                    </fieldset>
                );
            })}
        </form>
    );
}