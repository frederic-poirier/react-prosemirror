import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, Pencil, Space, CornerDownLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "../utils/useSetting";
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


export function FormList({ children, defaultValues = {} }) {
    const [settings, setSetting] = useSettings(defaultValues);

    return (
        <form className="block-list">
            {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return child;

                const { settingKey, defaultValue } = child.props;
                if (!settingKey) return child;

                const value = settings[settingKey] ?? defaultValue;

                return React.cloneElement(child, {
                    value,
                    onChange: (val) => setSetting(settingKey, val),
                });
            })}
        </form>
    );
}



export function Switch({ label, value = false, onChange }) {
    const id = crypto.randomUUID()

    return (
        <label htmlFor={id}>
            {label}
            <span className="switch">
                <input
                    type="checkbox"
                    id={id}
                    onChange={() => onChange(!value)}
                    checked={value}
                />
                <span className="slider"></span>
            </span>
        </label>
    )
}



export function Shortcut({ label, value = [], onChange, maxLength }) {
    const conversionKey = new Map([
        ['Escape', 'ESC'],
        [' ', 'Space'],
        ['Control', 'CTRL'],
        ['Shift', 'SHFT'],
        ['CAPSLOCK', 'CAPS']
    ]);

    const convertKeys = (keys) => keys.map(k => conversionKey.get(k) || k);

    const [record, setRecord] = useState(false);
    const inputRef = useRef(null);
    const shortcutRef = useRef(null);

    const stopRecording = () => {
        setRecord(false);
    };

    const toggleRecord = () => {
        setRecord(prev => {
            const next = !prev;
            if (next) setTimeout(() => inputRef.current?.focus(), 0);
            return next;
        });
    };

    const handleKeyDown = (e) => {
        e.preventDefault();
        let key = e.key;
        if (conversionKey.has(key)) key = conversionKey.get(key);

        if (!value.includes(key)) {
            let newKeys = [...value, key];
            if (maxLength && newKeys.length > maxLength) {
                newKeys = newKeys.slice(-maxLength);
            }
            onChange(newKeys);
        }
    };

    const handleDocumentClick = useCallback((e) => {
        // Check if click is outside the shortcut component
        if (shortcutRef.current && !shortcutRef.current.contains(e.target)) {
            stopRecording();
        }
    }, []);

    useEffect(() => {
        if (record) document.addEventListener('click', handleDocumentClick);
        else document.removeEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, [handleDocumentClick, record]);

    return (
        <label ref={shortcutRef}>
            {label}
            <span className="shortcut">
                {value.length === 0 && record ? (
                    <span>Listening...</span>
                ) : (
                    convertKeys(value).map((k, i) => <kbd key={i}>{k}</kbd>)
                )}

                <button
                    type="button"
                    onClick={toggleRecord}
                >
                    {!record ? <Pencil /> : <KeyboardIcon />}
                </button>
            </span>

            {record && (
                <input
                    ref={inputRef}
                    name='recorder'
                    type="text"
                    onKeyDown={handleKeyDown}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
            )}
        </label>
    );
}

const KeyboardIcon = React.memo(function KeyboardIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--pulse-color, currentColor)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-keyboard-icon lucide-keyboard"
        >
            <style>
                {`
          .lucide-keyboard path {
            animation: pulse 1s infinite;
            --pulse-color: light-dark(#333, #eee)
          }

          path:nth-of-type(1) { animation-delay: 0s; }
          path:nth-of-type(2) { animation-delay: 0.1s; }
          path:nth-of-type(3) { animation-delay: 0.2s; }
          path:nth-of-type(4) { animation-delay: 0.3s; }
          path:nth-of-type(5) { animation-delay: 0.4s; }
          path:nth-of-type(6) { animation-delay: 0.5s; }
          path:nth-of-type(7) { animation-delay: 0.6s; }
          path:nth-of-type(8) { animation-delay: 0.7s; }

          @keyframes pulse {
            0%, 100% { stroke: var(--pulse-color, currentColor); opacity: 1; }
            50% { stroke: var(--pulse-color); opacity: 0.5; }
          }
        `}
            </style>

            <path d="M10 8h.01" />
            <path d="M12 12h.01" />
            <path d="M14 8h.01" />
            <path d="M16 12h.01" />
            <path d="M18 8h.01" />
            <path d="M6 8h.01" />
            <path d="M7 16h10" />
            <path d="M8 12h.01" />
            <rect width={20} height={16} x={2} y={4} rx={2} />
        </svg>
    );
})

