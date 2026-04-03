
"use client";

import { Sun, Moon } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function ThemeSwitcher() {
    const { theme, setTheme } = useAppContext();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    
    const handleThemeChange = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    if (!mounted) {
        return <div className="h-9 w-9" />;
    }

    const renderIcon = () => {
        switch (theme) {
            case 'light':
                return <Sun className="h-5 w-5" />;
            case 'dark':
                return <Moon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeChange}
            className="h-9 w-9"
            aria-label="Switch theme"
        >
            {renderIcon()}
        </Button>
    );
}
