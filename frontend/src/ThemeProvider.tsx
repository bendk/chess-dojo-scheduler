import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/system';
import { Breakpoint, createTheme, useTheme } from '@mui/material/styles';
import { CssBaseline, PaletteMode, useMediaQuery } from '@mui/material';

import { useAuth } from './auth/Auth';
import { deepPurple } from '@mui/material/colors';

declare module '@mui/material/styles' {
    interface Palette {
        opening: Palette['primary'];
        endgame: Palette['primary'];
        dojoOrange: Palette['primary'];
        subscribe: Palette['primary'];
        coaching: Palette['primary'];
    }
    interface PaletteOptions {
        opening?: PaletteOptions['primary'];
        endgame?: Palette['primary'];
        dojoOrange?: PaletteOptions['primary'];
        subscribe?: PaletteOptions['primary'];
        coaching?: PaletteOptions['primary'];
    }
}

declare module '@mui/material' {
    interface ChipPropsColorOverrides {
        opening: true;
        endgame: true;
    }

    interface CheckboxPropsColorOverrides {
        opening: true;
        endgame: true;
        coaching: true;
    }

    interface ButtonPropsColorOverrides {
        dojoOrange: true;
        subscribe: true;
    }
}

const defaultTheme = createTheme({});

export function useLocalStorage<T>(
    storageKey: string,
    fallbackState: T,
    parser?: (v: string) => T
): [T, (v: T) => void] {
    let initialValue = fallbackState;
    const localStorageVal = localStorage.getItem(storageKey);
    try {
        if (
            localStorageVal &&
            localStorageVal !== 'null' &&
            localStorageVal !== 'undefined'
        ) {
            if (parser) {
                initialValue = parser(localStorageVal);
            } else {
                initialValue = JSON.parse(localStorageVal);
            }
        }
    } catch (err) {
        console.error(err);
    }

    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(value));
    }, [value, storageKey]);

    return [value, setValue];
}

export function useLightMode(): boolean {
    return useAuth().user?.enableLightMode || false;
}

export function useBreakpoint(): Breakpoint {
    const theme = useTheme();
    const xl = useMediaQuery(theme.breakpoints.up('xl'));
    const lg = useMediaQuery(theme.breakpoints.up('lg'));
    const md = useMediaQuery(theme.breakpoints.up('md'));
    const sm = useMediaQuery(theme.breakpoints.up('sm'));

    if (xl) {
        return 'xl';
    }
    if (lg) {
        return 'lg';
    }
    if (md) {
        return 'md';
    }
    if (sm) {
        return 'sm';
    }
    return 'xs';
}

export function useWindowSizeEffect(handler: () => void) {
    useEffect(() => {
        window.addEventListener('resize', handler);
        // handler();
        return () => window.removeEventListener('resize', handler);
    }, [handler]);
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const user = useAuth().user;
    const [colorMode, setColorMode] = useLocalStorage(
        'colorMode',
        user?.enableLightMode ? 'light' : 'dark'
    );

    useEffect(() => {
        if (user) {
            setColorMode(user.enableLightMode ? 'light' : 'dark');
        }
    }, [setColorMode, user]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: colorMode as PaletteMode,
                    dojoOrange: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#F7941F',
                        },
                        name: 'dojoOrange',
                    }),
                    opening: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#cc0000',
                        },
                        name: 'opening',
                    }),
                    endgame: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#674ea7',
                        },
                        name: 'endgame',
                    }),
                    subscribe: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#1565c0',
                        },
                        name: 'subscribe',
                    }),
                    coaching: defaultTheme.palette.augmentColor({
                        color: {
                            main: deepPurple[400],
                        },
                        name: 'coaching',
                    }),
                },
            }),
        [colorMode]
    );

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
};

export default ThemeProvider;
