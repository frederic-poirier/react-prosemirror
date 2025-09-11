import { Outlet, Link, useLocation } from "react-router-dom";
import { ChevronRight, House } from 'lucide-react';
import './SettingsLayout.css'

export default function SettingsLayout() {
    return (
        <>
            <header className="settings-header page">
                <Breadcrumbs />
            </header>

            <main className="settings-main page">
                <Outlet />
            </main>
        </>
    );
}


const Breadcrumbs = () => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean)
    const crumbs = segments.map((segment, index) => {
        const to = "/" + segments.slice(0, index + 1).join("/")
        const label = segment;
        return { label, to };
    })

    return (
        <nav className="settings-breadcrumbs">
            <Link to='/'><House /></Link>
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return <span key={crumb.to}>
                    <ChevronRight />
                    <Link
                        to={crumb.to}
                        disabled={isLast}
                    >
                        {crumb.label}
                    </Link>
                </span>
            })}
        </nav>
    )
}